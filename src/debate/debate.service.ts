import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DebateThread, DebateThreadDocument, ThreadStatus } from '../database/schemas/debate-thread.schema';
import { Vote, VoteDocument, VoteType } from '../database/schemas/vote.schema';
import { Argument, ArgumentDocument, ArgumentStatus, ArgumentType } from '../database/schemas/argument.schema';
import { ModerationLog, ModerationLogDocument, ModerationAction } from '../database/schemas/moderation-log.schema';
import { User, UserDocument, UserRole } from '../database/schemas/user.schema';

export interface CreateThreadDto {
    title: string;
    description?: string;
    createdBy: string;
    moderators: string[];
    modForSideA?: string;
    modForSideB?: string;
    startDate?: Date;
    endDate?: Date;
    allowVoting?: boolean;
    allowArguments?: boolean;
    requireModeration?: boolean;
    // Ticketed flow
    isTicketRequest?: boolean;
    requestedBy?: string;
}

export interface CreateVoteDto {
    userId: string;
    threadId: string;
    voteType: VoteType;
}

export interface CreateArgumentDto {
    title: string;
    content: string;
    authorId: string;
    threadId: string;
    argumentType: ArgumentType;
}

export interface ModerateArgumentDto {
    argumentId: string;
    moderatorId: string;
    action: ModerationAction;
    reason?: string;
    notes?: string;
}

@Injectable()
export class DebateService {
    constructor(
        @InjectModel(DebateThread.name) private debateThreadModel: Model<DebateThreadDocument>,
        @InjectModel(Vote.name) private voteModel: Model<VoteDocument>,
        @InjectModel(Argument.name) private argumentModel: Model<ArgumentDocument>,
        @InjectModel(ModerationLog.name) private moderationLogModel: Model<ModerationLogDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    // Thread Management
    async createThread(data: CreateThreadDto): Promise<DebateThreadDocument> {
        // Validate required fields
        if (!data.title || !data.createdBy) {
            throw new BadRequestException('Title and createdBy are required');
        }

        // Check if creator exists and has permission
        const creator = await this.userModel.findById(data.createdBy);
        if (!creator) {
            throw new NotFoundException('Creator not found');
        }

        if (![UserRole.ADMIN, UserRole.MODERATOR].includes(creator.role)) {
            throw new ForbiddenException('Only admins and moderators can create debate threads');
        }

        // Validate moderators
        if (data.moderators && data.moderators.length > 0) {
            const moderators = await this.userModel.find({
                _id: { $in: data.moderators },
                role: { $in: [UserRole.ADMIN, UserRole.MODERATOR] }
            });

            if (moderators.length !== data.moderators.length) {
                throw new BadRequestException('Some moderators are invalid or don\'t have moderator privileges');
            }
        }

        const thread = new this.debateThreadModel({
            ...data,
            status: ThreadStatus.DRAFT,
            totalVotes: 0,
            totalArguments: 0,
            totalApprovedArguments: 0,
            allowVoting: data.allowVoting ?? true,
            allowArguments: data.allowArguments ?? true,
            requireModeration: data.requireModeration ?? true,
            isTicketRequest: data.isTicketRequest ?? false,
            requestedBy: data.requestedBy ? new Types.ObjectId(data.requestedBy) : undefined,
            modForSideA: data.modForSideA ? new Types.ObjectId(data.modForSideA) : undefined,
            modForSideB: data.modForSideB ? new Types.ObjectId(data.modForSideB) : undefined,
        });

        return await thread.save();
    }

    async requestThread(title: string, description: string | undefined, requestedBy: string): Promise<DebateThreadDocument> {
        // Any verified user can request
        const requester = await this.userModel.findById(requestedBy);
        if (!requester) {
            throw new NotFoundException('Requester not found');
        }

        const thread = new this.debateThreadModel({
            title,
            description,
            createdBy: requester._id,
            isTicketRequest: true,
            requestedBy: requester._id,
            status: ThreadStatus.DRAFT,
            allowVoting: true,
            allowArguments: true,
            requireModeration: true,
        });
        return await thread.save();
    }

    async approveThread(threadId: string, adminId: string, modForSideA: string, modForSideB: string): Promise<DebateThreadDocument> {
        const admin = await this.userModel.findById(adminId);
        if (!admin) throw new NotFoundException('Admin not found');
        if (admin.role !== UserRole.ADMIN) throw new ForbiddenException('Only admin can approve threads');

        const [modA, modB] = await Promise.all([
            this.userModel.findById(modForSideA),
            this.userModel.findById(modForSideB),
        ]);
        if (!modA || !modB) throw new BadRequestException('Invalid moderators');
        if (![UserRole.ADMIN, UserRole.MODERATOR].includes(modA.role) || ![UserRole.ADMIN, UserRole.MODERATOR].includes(modB.role)) {
            throw new BadRequestException('Moderators must be MODERATOR or ADMIN');
        }

        const thread = await this.debateThreadModel.findByIdAndUpdate(
            threadId,
            {
                status: ThreadStatus.ACTIVE,
                isTicketRequest: false,
                modForSideA: modA._id,
                modForSideB: modB._id,
                moderators: [modA._id, modB._id],
            },
            { new: true }
        ).exec();
        if (!thread) throw new NotFoundException('Thread not found');
        return thread;
    }

    async getModerationQueueForModerator(moderatorId: string, isAdmin: boolean = false): Promise<ArgumentDocument[]> {
        // Admins see all pending arguments
        if (isAdmin) {
            return await this.argumentModel
                .find({ status: ArgumentStatus.PENDING })
                .populate('authorId', 'username email firstName lastName avatar')
                .populate('moderatedBy', 'username email firstName lastName avatar')
                .sort({ createdAt: 1 })
                .exec();
        }
        // Normalize moderator id to ObjectId for reliable matching
        const modObjectId = Types.ObjectId.isValid(moderatorId)
            ? new Types.ObjectId(moderatorId)
            : undefined;

        // Arguments pending in threads where this moderator is assigned (A or B or in moderators array)
        const threadFilter: any = modObjectId
            ? {
                $or: [
                    { modForSideA: modObjectId },
                    { modForSideB: modObjectId },
                    { moderators: modObjectId },
                    { createdBy: modObjectId },
                ],
            }
            : {
                $or: [
                    { modForSideA: moderatorId },
                    { modForSideB: moderatorId },
                    { moderators: { $in: [moderatorId] } },
                    { createdBy: moderatorId },
                ],
            };

        const threads = await this.debateThreadModel
            .find(threadFilter)
            .select('_id')
            .lean();

        if (!threads.length) {
            return [];
        }

        const threadIds = threads.map((t: any) => t._id);

        return await this.argumentModel
            .find({ threadId: { $in: threadIds }, status: ArgumentStatus.PENDING })
            .populate('authorId', 'username email firstName lastName avatar')
            .populate('moderatedBy', 'username email firstName lastName avatar')
            .sort({ createdAt: 1 })
            .exec();
    }

    async getThread(id: string): Promise<DebateThreadDocument> {
        const thread = await this.debateThreadModel.findById(id)
            .populate('createdBy', 'username email firstName lastName avatar')
            .populate('moderators', 'username email firstName lastName avatar')
            .exec();

        if (!thread) {
            throw new NotFoundException('Debate thread not found');
        }

        return thread;
    }

    async getAllThreads(status?: ThreadStatus): Promise<DebateThreadDocument[]> {
        const filter = status ? { status } : {};
        return await this.debateThreadModel.find(filter)
            .populate('createdBy', 'username email firstName lastName avatar')
            .populate('moderators', 'username email firstName lastName avatar')
            .sort({ createdAt: -1 })
            .exec();
    }

    async updateThreadStatus(id: string, status: ThreadStatus, userId: string): Promise<DebateThreadDocument> {
        const thread = await this.debateThreadModel.findById(id);
        if (!thread) {
            throw new NotFoundException('Debate thread not found');
        }

        // Check if user has permission to update thread
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isModerator = thread.moderators.some(modId => modId.toString() === userId);
        const isCreator = thread.createdBy.toString() === userId;

        if (![UserRole.ADMIN, UserRole.MODERATOR].includes(user.role) && !isModerator && !isCreator) {
            throw new ForbiddenException('You don\'t have permission to update this thread');
        }

        const updatedThread = await this.debateThreadModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).exec();

        if (!updatedThread) {
            throw new NotFoundException('Thread not found after update');
        }

        return updatedThread;
    }

    // Voting System
    async vote(data: CreateVoteDto): Promise<VoteDocument> {
        // Validate required fields
        if (!data.userId || !data.threadId || !data.voteType) {
            throw new BadRequestException('userId, threadId, and voteType are required');
        }

        // Check if user exists
        const user = await this.userModel.findById(data.userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if thread exists and is active
        const thread = await this.debateThreadModel.findById(data.threadId);
        if (!thread) {
            throw new NotFoundException('Debate thread not found');
        }

        if (thread.status !== ThreadStatus.ACTIVE) {
            throw new BadRequestException('Thread is not active for voting');
        }

        if (!thread.allowVoting) {
            throw new BadRequestException('Voting is not allowed for this thread');
        }

        // Normalize ids to ObjectId
        const userObjectId = Types.ObjectId.isValid(data.userId) ? new Types.ObjectId(data.userId) : undefined;
        const threadObjectId = Types.ObjectId.isValid(data.threadId) ? new Types.ObjectId(data.threadId) : undefined;
        if (!userObjectId || !threadObjectId) {
            throw new BadRequestException('Invalid userId or threadId');
        }

        // Check if user already voted
        const existingVote = await this.voteModel.findOne({
            userId: userObjectId,
            threadId: threadObjectId,
        });

        if (existingVote) {
            // Update existing vote
            existingVote.voteType = data.voteType;
            existingVote.votedAt = new Date();
            return await existingVote.save();
        }

        // Create new vote
        const vote = new this.voteModel({
            userId: userObjectId,
            threadId: threadObjectId,
            voteType: data.voteType,
            votedAt: new Date(),
        });
        const savedVote = await vote.save();

        // Update thread vote count
        await this.debateThreadModel.findByIdAndUpdate(
            data.threadId,
            { $inc: { totalVotes: 1 } }
        );

        return savedVote;
    }

    async getUserVote(userId: string, threadId: string): Promise<VoteDocument | null> {
        return await this.voteModel.findOne({ userId, threadId }).exec();
    }

    async getThreadVotes(threadId: string): Promise<{ support: number; oppose: number }> {
        const votes = await this.voteModel.find({ threadId }).exec();

        const support = votes.filter(vote => vote.voteType === VoteType.SUPPORT).length;
        const oppose = votes.filter(vote => vote.voteType === VoteType.OPPOSE).length;

        return { support, oppose };
    }

    // Argument System
    async createArgument(data: CreateArgumentDto): Promise<ArgumentDocument> {
        // Validate required fields
        if (!data.title || !data.content || !data.authorId || !data.threadId || !data.argumentType) {
            throw new BadRequestException('All fields are required');
        }

        // Check if user exists
        const user = await this.userModel.findById(data.authorId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if thread exists and allows arguments
        const thread = await this.debateThreadModel.findById(data.threadId);
        if (!thread) {
            throw new NotFoundException('Debate thread not found');
        }

        if (!thread.allowArguments) {
            throw new BadRequestException('Arguments are not allowed for this thread');
        }

        // Determine author's side by their vote on this thread
        const existingVote = await this.voteModel.findOne({
            userId: data.authorId,
            threadId: data.threadId,
        }).lean();

        const computedArgumentType = existingVote
            ? (existingVote.voteType === VoteType.SUPPORT ? ArgumentType.SUPPORT : ArgumentType.OPPOSE)
            : data.argumentType; // fallback to provided type if no vote

        // Create argument with normalized ObjectId fields
        const authorObjectId = Types.ObjectId.isValid(data.authorId) ? new Types.ObjectId(data.authorId) : undefined;
        const threadObjectId = Types.ObjectId.isValid(data.threadId) ? new Types.ObjectId(data.threadId) : undefined;
        if (!authorObjectId || !threadObjectId) {
            throw new BadRequestException('Invalid authorId or threadId');
        }

        const argument = new this.argumentModel({
            title: data.title,
            content: data.content,
            authorId: authorObjectId,
            threadId: threadObjectId,
            argumentType: computedArgumentType,
            status: thread.requireModeration ? ArgumentStatus.PENDING : ArgumentStatus.APPROVED,
        });

        const savedArgument = await argument.save();

        // Update thread argument count
        await this.debateThreadModel.findByIdAndUpdate(
            data.threadId,
            { $inc: { totalArguments: 1 } }
        );

        // If auto-approved, increment approved count
        if (!thread.requireModeration) {
            await this.debateThreadModel.findByIdAndUpdate(
                data.threadId,
                { $inc: { totalApprovedArguments: 1 } }
            );
        }

        return savedArgument;
    }

    async getArguments(threadId: string, status?: ArgumentStatus): Promise<ArgumentDocument[]> {
        const filter: any = { threadId };
        if (status) {
            filter.status = status;
        }

        return await this.argumentModel.find(filter)
            .populate('authorId', 'username email firstName lastName avatar')
            .populate('moderatedBy', 'username email firstName lastName avatar')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getArgument(id: string): Promise<ArgumentDocument> {
        const argument = await this.argumentModel.findById(id)
            .populate('authorId', 'username email firstName lastName avatar')
            .populate('moderatedBy', 'username email firstName lastName avatar')
            .exec();

        if (!argument) {
            throw new NotFoundException('Argument not found');
        }

        return argument;
    }

    // Moderation System
    async moderateArgument(data: ModerateArgumentDto): Promise<ArgumentDocument> {
        // Validate required fields
        if (!data.argumentId || !data.moderatorId || !data.action) {
            throw new BadRequestException('argumentId, moderatorId, and action are required');
        }

        // Check if moderator exists and has permission
        const moderator = await this.userModel.findById(data.moderatorId);
        if (!moderator) {
            throw new NotFoundException('Moderator not found');
        }

        if (![UserRole.ADMIN, UserRole.MODERATOR].includes(moderator.role)) {
            throw new ForbiddenException('Only admins and moderators can moderate arguments');
        }

        // Check if argument exists
        const argument = await this.argumentModel.findById(data.argumentId);
        if (!argument) {
            throw new NotFoundException('Argument not found');
        }

        // Check if moderator has permission for this thread
        const thread = await this.debateThreadModel.findById(argument.threadId);
        if (!thread) {
            throw new NotFoundException('Thread not found');
        }

        const isModerator = thread.moderators.some(modId => modId.toString() === data.moderatorId);
        const isCreator = thread.createdBy.toString() === data.moderatorId;

        if (![UserRole.ADMIN, UserRole.MODERATOR].includes(moderator.role) && !isModerator && !isCreator) {
            throw new ForbiddenException('You don\'t have permission to moderate this thread');
        }

        // Update argument based on action
        let newStatus: ArgumentStatus;
        let updateData: any = {
            moderatedBy: Types.ObjectId.isValid(data.moderatorId) ? new Types.ObjectId(data.moderatorId) : data.moderatorId,
            moderationNotes: data.notes,
            moderatedAt: new Date(),
        };

        switch (data.action) {
            case ModerationAction.APPROVE:
                newStatus = ArgumentStatus.APPROVED;
                break;
            case ModerationAction.REJECT:
                newStatus = ArgumentStatus.REJECTED;
                updateData.rejectionReason = data.reason;
                break;
            case ModerationAction.FLAG:
                newStatus = ArgumentStatus.FLAGGED;
                break;
            case ModerationAction.HIGHLIGHT:
                updateData.isHighlighted = true;
                newStatus = argument.status; // Keep current status
                break;
            case ModerationAction.UNHIGHLIGHT:
                updateData.isHighlighted = false;
                newStatus = argument.status; // Keep current status
                break;
            default:
                throw new BadRequestException('Invalid moderation action');
        }

        if (newStatus) {
            updateData.status = newStatus;
        }

        const updatedArgument = await this.argumentModel.findByIdAndUpdate(
            data.argumentId,
            updateData,
            { new: true }
        ).exec();

        if (!updatedArgument) {
            throw new NotFoundException('Argument not found after update');
        }

        // Update thread approved count if argument was approved
        if (data.action === ModerationAction.APPROVE && argument.status !== ArgumentStatus.APPROVED) {
            await this.debateThreadModel.findByIdAndUpdate(
                argument.threadId,
                { $inc: { totalApprovedArguments: 1 } }
            );
        }

        // Log moderation action with normalized ObjectIds
        await this.moderationLogModel.create({
            moderatorId: Types.ObjectId.isValid(data.moderatorId) ? new Types.ObjectId(data.moderatorId) : data.moderatorId,
            argumentId: Types.ObjectId.isValid(data.argumentId) ? new Types.ObjectId(data.argumentId) : data.argumentId,
            action: data.action,
            reason: data.reason,
            notes: data.notes,
        });

        return updatedArgument;
    }

    async getModerationLogs(threadId?: string, moderatorId?: string): Promise<ModerationLogDocument[]> {
        const filter: any = {};
        if (threadId) {
            const threadObjectId = Types.ObjectId.isValid(threadId) ? new Types.ObjectId(threadId) : undefined;
            const argumentsInThread = await this.argumentModel.find({ threadId: threadObjectId ?? threadId }).select('_id');
            filter.argumentId = { $in: argumentsInThread.map(arg => arg._id) };
        }
        if (moderatorId) {
            filter.moderatorId = Types.ObjectId.isValid(moderatorId) ? new Types.ObjectId(moderatorId) : moderatorId;
        }

        return await this.moderationLogModel.find(filter)
            .populate('moderatorId', 'username email firstName lastName avatar')
            .populate('argumentId', 'title content')
            .sort({ actionDate: -1 })
            .exec();
    }

    // Statistics
    async getThreadStats(threadId: string): Promise<{
        totalVotes: number;
        supportVotes: number;
        opposeVotes: number;
        totalArguments: number;
        approvedArguments: number;
        pendingArguments: number;
        rejectedArguments: number;
        flaggedArguments: number;
    }> {
        const [votes, threadArguments] = await Promise.all([
            this.voteModel.find({ threadId }),
            this.argumentModel.find({ threadId })
        ]);

        const supportVotes = votes.filter(vote => vote.voteType === VoteType.SUPPORT).length;
        const opposeVotes = votes.filter(vote => vote.voteType === VoteType.OPPOSE).length;
        const approvedArguments = threadArguments.filter(arg => arg.status === ArgumentStatus.APPROVED).length;
        const pendingArguments = threadArguments.filter(arg => arg.status === ArgumentStatus.PENDING).length;
        const rejectedArguments = threadArguments.filter(arg => arg.status === ArgumentStatus.REJECTED).length;
        const flaggedArguments = threadArguments.filter(arg => arg.status === ArgumentStatus.FLAGGED).length;

        return {
            totalVotes: votes.length,
            supportVotes,
            opposeVotes,
            totalArguments: threadArguments.length,
            approvedArguments,
            pendingArguments,
            rejectedArguments,
            flaggedArguments,
        };
    }
}