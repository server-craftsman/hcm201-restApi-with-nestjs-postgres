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

export interface VoteStats {
    threadId: string;
    totalVotes: number;
    support: number;
    oppose: number;
    supportPercentage: number;
    opposePercentage: number;
    userVote?: 'SUPPORT' | 'OPPOSE' | null;
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
    argumentType?: ArgumentType;
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

    async requestThread(title: string, description: string | undefined, requestedBy: string, extra?: { category?: string; summary?: string; priority?: 'HIGH' | 'MEDIUM' | 'LOW'; expectedParticipants?: string; images?: string[]; }): Promise<DebateThreadDocument> {
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
            // Extra metadata (non-breaking: stored as loose fields if schema allows)
            category: extra?.category,
            summary: extra?.summary,
            priority: extra?.priority,
            expectedParticipants: extra?.expectedParticipants,
            images: extra?.images,
        });
        return await thread.save();
    }

    async getMyThreadRequests(userId: string, page: number = 1, limit: number = 20): Promise<{ items: DebateThreadDocument[]; totalItems: number; page: number; limit: number }> {
        const requester = await this.userModel.findById(userId);
        if (!requester) throw new NotFoundException('User not found');

        const filter: any = { isTicketRequest: true, requestedBy: requester._id };
        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const [items, totalItems] = await Promise.all([
            this.debateThreadModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.debateThreadModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
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

    // Overloads for moderation queue (backwards compatible)
    async getModerationQueueForModerator(moderatorId: string, isAdmin?: boolean): Promise<{ items: ArgumentDocument[]; totalItems: number; page: number; limit: number }>;
    async getModerationQueueForModerator(
        moderatorId: string,
        isAdmin: boolean = false,
        query?: {
            status?: ArgumentStatus;
            argumentType?: ArgumentType;
            threadId?: string;
            search?: string;
            page?: number;
            limit?: number;
            sort?: string;
        },
    ): Promise<
        | { items: ArgumentDocument[]; totalItems: number; page: number; limit: number }
        | { support: { items: ArgumentDocument[]; totalItems: number; page: number; limit: number }, oppose: { items: ArgumentDocument[]; totalItems: number; page: number; limit: number } }
    > {
        const page = Number(query?.page ?? 1);
        const limit = Math.max(1, Math.min(Number(query?.limit ?? 20), 100));
        const skip = Math.max(0, (page - 1) * limit);
        const sort: any = (() => {
            if (!query?.sort) return { createdAt: 1 };
            const [field, dir] = String(query.sort).split(':');
            const direction = Number(dir) === -1 ? -1 : 1;
            return { [field]: direction };
        })();

        const baseFilter: any = {};
        // Status filter - if not provided, get all statuses
        if (query?.status) {
            baseFilter.status = query.status;
        }
        if (query?.argumentType) baseFilter.argumentType = query.argumentType;
        if (query?.threadId) baseFilter.threadId = Types.ObjectId.isValid(query.threadId) ? new Types.ObjectId(query.threadId) : query.threadId;
        if (query?.search) {
            baseFilter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { content: { $regex: query.search, $options: 'i' } },
            ];
        }

        // Admins see according to filter only
        if (isAdmin) {
            const [items, totalItems] = await Promise.all([
                this.argumentModel
                    .find(baseFilter)
                    .populate('authorId', 'username email firstName lastName avatar')
                    .populate('moderatedBy', 'username email firstName lastName avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.argumentModel.countDocuments(baseFilter),
            ]);
            return { items, totalItems, page, limit };
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
            .select('_id modForSideA modForSideB moderators')
            .lean();

        if (!threads.length) {
            return { items: [], totalItems: 0, page, limit };
        }

        const threadIds = threads.map((t: any) => t._id);

        // Build side-aware filter so a moderator only sees arguments of their assigned side
        // - If moderator is modForSideA on a thread => can moderate SUPPORT arguments there
        // - If moderator is modForSideB on a thread => can moderate OPPOSE arguments there
        // - If moderator is in moderators array => can see both sides for that thread
        const sideAThreadIds: any[] = [];
        const sideBThreadIds: any[] = [];
        const generalThreadIds: any[] = [];

        for (const t of threads as any[]) {
            const isGeneral = Array.isArray(t.moderators) && (modObjectId
                ? t.moderators.some((m: any) => String(m) === String(modObjectId))
                : t.moderators.includes(moderatorId));
            const isSideA = t.modForSideA && String(t.modForSideA) === String(modObjectId ?? moderatorId);
            const isSideB = t.modForSideB && String(t.modForSideB) === String(modObjectId ?? moderatorId);

            if (isGeneral) {
                generalThreadIds.push(t._id);
            }
            if (isSideA) {
                sideAThreadIds.push(t._id);
            }
            if (isSideB) {
                sideBThreadIds.push(t._id);
            }
        }

        // If client specifies a threadId explicitly, still enforce side rules for that thread
        // but allow both sides if the moderator is a general moderator on it.
        let sideAwareOr: any[] = [];
        if (baseFilter.threadId) {
            const specificId = baseFilter.threadId;
            const isGeneral = generalThreadIds.some(id => String(id) === String(specificId));
            const isA = sideAThreadIds.some(id => String(id) === String(specificId));
            const isB = sideBThreadIds.some(id => String(id) === String(specificId));

            // If argumentType already specified, just keep it but ensure access is allowed
            if (baseFilter.argumentType) {
                const type = baseFilter.argumentType;
                const allowed = isGeneral || (isA && String(type) === String(ArgumentType.SUPPORT)) || (isB && String(type) === String(ArgumentType.OPPOSE));
                if (!allowed) {
                    return { items: [], totalItems: 0, page, limit };
                }
                sideAwareOr = [{ threadId: specificId, argumentType: type }];
            } else {
                const ors: any[] = [];
                if (isGeneral) {
                    ors.push({ threadId: specificId });
                }
                if (isA) {
                    ors.push({ threadId: specificId, argumentType: ArgumentType.SUPPORT });
                }
                if (isB) {
                    ors.push({ threadId: specificId, argumentType: ArgumentType.OPPOSE });
                }
                if (!ors.length) {
                    return { items: [], totalItems: 0, page, limit };
                }
                sideAwareOr = ors;
            }
        } else {
            // No specific threadId: build OR across all assigned threads according to side
            const ors: any[] = [];
            if (generalThreadIds.length) {
                ors.push({ threadId: { $in: generalThreadIds } });
            }
            if (sideAThreadIds.length) {
                ors.push({ threadId: { $in: sideAThreadIds }, argumentType: ArgumentType.SUPPORT });
            }
            if (sideBThreadIds.length) {
                ors.push({ threadId: { $in: sideBThreadIds }, argumentType: ArgumentType.OPPOSE });
            }
            if (!ors.length) {
                return { items: [], totalItems: 0, page, limit };
            }
            // If client specified argumentType globally, intersect with OR rules
            if (baseFilter.argumentType) {
                const type = baseFilter.argumentType;
                sideAwareOr = ors.map(rule => ({ ...rule, argumentType: rule.argumentType ?? type }));
            } else {
                sideAwareOr = ors;
            }
        }

        const moderatorFilter: any = { ...baseFilter };
        delete moderatorFilter.threadId; // handled in sideAwareOr
        // When sideAwareOr contains simple {threadId} clauses and the baseFilter has argumentType, those will be added above
        moderatorFilter.$or = sideAwareOr;

        // If grouping is requested, run two queries with side constraints
        if ((query as any)?.groupBySide) {
            // Build per-side filters
            const supportFilter = { ...moderatorFilter } as any;
            const opposeFilter = { ...moderatorFilter } as any;

            // Force argumentType per side, but do not overwrite when already constrained in each OR rule
            // We will append type only where not already specified
            const appendTypeToOr = (rules: any[], type: ArgumentType) =>
                rules.map(r => (r.argumentType ? r : { ...r, argumentType: type }));

            if (Array.isArray(supportFilter.$or)) {
                supportFilter.$or = appendTypeToOr(supportFilter.$or, ArgumentType.SUPPORT);
            } else {
                supportFilter.argumentType = ArgumentType.SUPPORT;
            }

            if (Array.isArray(opposeFilter.$or)) {
                opposeFilter.$or = appendTypeToOr(opposeFilter.$or, ArgumentType.OPPOSE);
            } else {
                opposeFilter.argumentType = ArgumentType.OPPOSE;
            }

            const [supportItems, supportTotal, opposeItems, opposeTotal] = await Promise.all([
                this.argumentModel.find(supportFilter)
                    .populate('authorId', 'username email firstName lastName avatar')
                    .populate('moderatedBy', 'username email firstName lastName avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.argumentModel.countDocuments(supportFilter),
                this.argumentModel.find(opposeFilter)
                    .populate('authorId', 'username email firstName lastName avatar')
                    .populate('moderatedBy', 'username email firstName lastName avatar')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.argumentModel.countDocuments(opposeFilter),
            ]);

            return {
                support: { items: supportItems, totalItems: supportTotal, page, limit },
                oppose: { items: opposeItems, totalItems: opposeTotal, page, limit },
            };
        }

        const [items, totalItems] = await Promise.all([
            this.argumentModel
                .find(moderatorFilter)
                .populate('authorId', 'username email firstName lastName avatar')
                .populate('moderatedBy', 'username email firstName lastName avatar')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.argumentModel.countDocuments(moderatorFilter),
        ]);
        return { items, totalItems, page, limit };
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

    // Overloads for threads list (backwards compatible)
    async getAllThreads(status?: ThreadStatus, page?: number, limit?: number): Promise<{ items: DebateThreadDocument[]; totalItems: number; page: number; limit: number }>;
    async getAllThreads(
        status?: ThreadStatus,
        page: number = 1,
        limit: number = 20,
        options?: { search?: string; createdBy?: string; moderatorId?: string; sort?: string },
    ): Promise<{ items: DebateThreadDocument[]; totalItems: number; page: number; limit: number }> {
        const filter: any = {};

        // Status filter
        if (status) {
            filter.status = status;
        }

        // CreatedBy filter
        if (options?.createdBy) {
            filter.createdBy = Types.ObjectId.isValid(options.createdBy) ? new Types.ObjectId(options.createdBy) : options.createdBy;
        }

        // ModeratorId filter
        if (options?.moderatorId) {
            const moderatorId = Types.ObjectId.isValid(options.moderatorId) ? new Types.ObjectId(options.moderatorId) : options.moderatorId;
            filter.$or = [
                { modForSideA: moderatorId },
                { modForSideB: moderatorId },
                { moderators: moderatorId },
            ];
        }

        // Search filter
        if (options?.search) {
            const searchRegex = { $regex: options.search, $options: 'i' };
            const searchConditions = [
                { title: searchRegex },
                { description: searchRegex }
            ];

            if (filter.$or) {
                // If moderatorId filter exists, combine with search using $and
                filter.$and = [
                    { $or: filter.$or },
                    { $or: searchConditions }
                ];
                delete filter.$or;
            } else {
                filter.$or = searchConditions;
            }
        }

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const sort: any = (() => {
            if (!options?.sort) return { createdAt: -1 };
            const [field, dir] = String(options.sort).split(':');
            const direction = Number(dir) === 1 || String(dir) === 'asc' ? 1 : -1;
            return { [field]: direction };
        })();

        console.log('🔍 getAllThreads filter:', JSON.stringify(filter, null, 2));

        const [items, totalItems] = await Promise.all([
            this.debateThreadModel.find(filter)
                .populate('createdBy', 'username email firstName lastName avatar')
                .populate('moderators', 'username email firstName lastName avatar')
                .populate('modForSideA', 'username email firstName lastName avatar')
                .populate('modForSideB', 'username email firstName lastName avatar')
                .sort(sort)
                .skip(skip)
                .limit(take)
                .exec(),
            this.debateThreadModel.countDocuments(filter),
        ]);

        console.log('📊 getAllThreads result:', { itemsCount: items.length, totalItems });

        return { items, totalItems, page: Number(page), limit: take };
    }

    // Debug method to check database content
    async debugThreads(): Promise<any> {
        const totalCount = await this.debateThreadModel.countDocuments();
        const statusCounts = await this.debateThreadModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const sampleThreads = await this.debateThreadModel.find().limit(5).select('title status createdAt').exec();

        return {
            totalCount,
            statusCounts,
            sampleThreads,
            timestamp: new Date()
        };
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

    async updateVote(userId: string, data: { threadId: string; voteType: VoteType }): Promise<VoteDocument> {
        // Validate required fields
        if (!userId || !data.threadId || !data.voteType) {
            throw new BadRequestException('userId, threadId, and voteType are required');
        }

        // Check if user exists
        const user = await this.userModel.findById(userId);
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
        const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
        const threadObjectId = Types.ObjectId.isValid(data.threadId) ? new Types.ObjectId(data.threadId) : undefined;
        if (!userObjectId || !threadObjectId) {
            throw new BadRequestException('Invalid userId or threadId');
        }

        // Find existing vote
        const existingVote = await this.voteModel.findOne({
            userId: userObjectId,
            threadId: threadObjectId,
        });

        if (!existingVote) {
            throw new NotFoundException('No existing vote found to update. Please create a vote first.');
        }

        // Update existing vote
        existingVote.voteType = data.voteType;
        existingVote.votedAt = new Date();
        return await existingVote.save();
    }

    async getUserVote(userId: string, threadId: string): Promise<VoteDocument | null> {
        const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : (userId as any);
        const threadObjectId = Types.ObjectId.isValid(threadId) ? new Types.ObjectId(threadId) : (threadId as any);
        return await this.voteModel.findOne({ userId: userObjectId, threadId: threadObjectId }).exec();
    }

    async getThreadVotes(threadId: string): Promise<{ support: number; oppose: number }> {
        const normalizedThreadId = Types.ObjectId.isValid(threadId) ? new Types.ObjectId(threadId) : (threadId as any);
        const votes = await this.voteModel.find({ threadId: normalizedThreadId }).exec();

        const support = votes.filter(vote => vote.voteType === VoteType.SUPPORT).length;
        const oppose = votes.filter(vote => vote.voteType === VoteType.OPPOSE).length;

        return { support, oppose };
    }

    async getMyVotes(userId: string, page: number = 1, limit: number = 20): Promise<{ items: VoteDocument[]; totalItems: number; page: number; limit: number }> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const filter = { userId: user._id } as any;

        const [items, totalItems] = await Promise.all([
            this.voteModel.find(filter)
                .populate('threadId', 'title status')
                .sort({ votedAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.voteModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }

    async getVoteStats(threadId: string, userId?: string): Promise<VoteStats> {
        const normalizedThreadId = Types.ObjectId.isValid(threadId) ? new Types.ObjectId(threadId) : (threadId as any);
        const votes = await this.voteModel.find({ threadId: normalizedThreadId }).exec();

        const support = votes.filter(v => v.voteType === VoteType.SUPPORT).length;
        const oppose = votes.filter(v => v.voteType === VoteType.OPPOSE).length;
        const totalVotes = support + oppose;
        const supportPercentage = totalVotes ? Number(((support / totalVotes) * 100).toFixed(2)) : 0;
        const opposePercentage = totalVotes ? Number(((oppose / totalVotes) * 100).toFixed(2)) : 0;

        let userVote: 'SUPPORT' | 'OPPOSE' | null | undefined = undefined;
        if (userId) {
            const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : (userId as any);
            const myVote = await this.voteModel.findOne({ userId: userObjectId, threadId: normalizedThreadId }).lean();
            userVote = myVote ? (myVote.voteType === VoteType.SUPPORT ? 'SUPPORT' : 'OPPOSE') : null;
        }

        return {
            threadId: String(threadId),
            totalVotes,
            support,
            oppose,
            supportPercentage,
            opposePercentage,
            userVote,
        };
    }

    // Argument System
    async createArgument(data: CreateArgumentDto): Promise<ArgumentDocument> {
        // Validate required fields (argumentType is derived from user's vote)
        if (!data.title || !data.content || !data.authorId || !data.threadId) {
            throw new BadRequestException('title, content, authorId and threadId are required');
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

        // Normalize ids early for reliable matching
        const authorObjectId = Types.ObjectId.isValid(data.authorId) ? new Types.ObjectId(data.authorId) : undefined;
        const threadObjectId = Types.ObjectId.isValid(data.threadId) ? new Types.ObjectId(data.threadId) : undefined;
        if (!authorObjectId || !threadObjectId) {
            throw new BadRequestException('Invalid authorId or threadId');
        }

        // Determine author's side by their vote on this thread (match by ObjectId)
        const existingVote = await this.voteModel.findOne({
            userId: authorObjectId,
            threadId: threadObjectId,
        }).lean();

        if (!existingVote) {
            throw new BadRequestException('You must vote on this thread before posting an argument');
        }

        const computedArgumentType = existingVote.voteType === VoteType.SUPPORT
            ? ArgumentType.SUPPORT
            : ArgumentType.OPPOSE;

        // Create argument with normalized ObjectId fields (already validated above)

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

    async getArguments(
        threadId: string,
        status?: ArgumentStatus,
        page: number = 1,
        limit: number = 20,
        userId?: string,
    ): Promise<{ items: ArgumentDocument[]; totalItems: number; page: number; limit: number }> {
        const normalizedThreadId = Types.ObjectId.isValid(threadId) ? new Types.ObjectId(threadId) : (threadId as any);
        const filter: any = { threadId: normalizedThreadId };
        if (status) {
            filter.status = status;
        }

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const [items, totalItems] = await Promise.all([
            this.argumentModel.find(filter)
                .populate('authorId', 'username email firstName lastName avatar')
                .populate('moderatedBy', 'username email firstName lastName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.argumentModel.countDocuments(filter),
        ]);

        // Thêm thông tin vote của user cho từng argument nếu userId được cung cấp
        if (userId) {
            const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

            // Lấy thông tin vote của user cho thread này
            const userVote = await this.voteModel.findOne({
                userId: userObjectId,
                threadId: normalizedThreadId,
            }).lean();

            // Thêm thông tin like/dislike của user cho từng argument
            const itemsWithUserVotes = await Promise.all(
                items.map(async (item) => {
                    const itemObj = item.toObject();

                    // Kiểm tra xem user đã like/dislike argument này chưa
                    const hasLiked = item.upvotedBy?.some(id => id.toString() === userObjectId.toString()) || false;
                    const hasDisliked = item.downvotedBy?.some(id => id.toString() === userObjectId.toString()) || false;

                    return {
                        ...itemObj,
                        userVote: {
                            threadVote: userVote?.voteType || null, // Vote của user cho thread
                            hasLiked, // User đã like argument này chưa
                            hasDisliked, // User đã dislike argument này chưa
                        }
                    };
                })
            );

            return { items: itemsWithUserVotes as any, totalItems, page: Number(page), limit: take };
        }

        return { items, totalItems, page: Number(page), limit: take };
    }

    async getArgument(id: string, userId?: string): Promise<any> {
        const argument = await this.argumentModel.findById(id)
            .populate('authorId', 'username email firstName lastName avatar')
            .populate('moderatedBy', 'username email firstName lastName avatar')
            .populate('threadId', 'title status description')
            .populate('parentArgumentId', 'title content authorId')
            .exec();

        if (!argument) {
            throw new NotFoundException('Argument not found');
        }

        // Increment view count
        await this.argumentModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

        // Nếu có userId, trả thêm thông tin user đã like/dislike argument và vote của user cho thread
        if (userId) {
            const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : (userId as any);
            const threadObjId = Types.ObjectId.isValid((argument as any).threadId?._id || (argument as any).threadId)
                ? new Types.ObjectId((argument as any).threadId?._id || (argument as any).threadId)
                : (argument as any).threadId;

            // Lấy vote của user trên thread
            const userVote = await this.voteModel.findOne({ userId: userObjectId, threadId: threadObjId }).lean();

            // Kiểm tra like/dislike
            const hasLiked = (argument as any).upvotedBy?.some((id: any) => id.toString() === userObjectId.toString()) || false;
            const hasDisliked = (argument as any).downvotedBy?.some((id: any) => id.toString() === userObjectId.toString()) || false;

            const argObj = (argument as any).toObject ? (argument as any).toObject() : argument;
            return {
                ...argObj,
                userVote: {
                    threadVote: userVote?.voteType || null,
                    hasLiked,
                    hasDisliked,
                },
            };
        }

        return argument;
    }

    async getMyThreads(userId: string, page: number = 1, limit: number = 20): Promise<{ items: DebateThreadDocument[]; totalItems: number; page: number; limit: number }> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const filter = { createdBy: user._id } as any;

        const [items, totalItems] = await Promise.all([
            this.debateThreadModel.find(filter)
                .populate('moderators', 'username email firstName lastName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.debateThreadModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }

    async getMyArguments(userId: string, page: number = 1, limit: number = 20): Promise<{ items: ArgumentDocument[]; totalItems: number; page: number; limit: number }> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const filter = { authorId: user._id } as any;

        const [items, totalItems] = await Promise.all([
            this.argumentModel.find(filter)
                .populate('threadId', 'title status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.argumentModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }

    async likeArgument(argumentId: string, userId: string): Promise<ArgumentDocument> {
        if (!argumentId || !userId) {
            throw new BadRequestException('argumentId and userId are required');
        }
        const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
        if (!userObjectId) throw new BadRequestException('Invalid userId');

        const updated = await this.argumentModel.findByIdAndUpdate(
            argumentId,
            {
                // addToSet prevents duplicates
                $addToSet: { upvotedBy: userObjectId },
                // ensure removal from opposite set
                $pull: { downvotedBy: userObjectId },
                // recompute counters atomically via pipeline update not available here; approximate with $inc
            },
            { new: true }
        );
        if (!updated) throw new NotFoundException('Argument not found');

        // Recompute counters based on arrays to ensure correctness
        const upvotes = updated.upvotedBy?.length || 0;
        const downvotes = updated.downvotedBy?.length || 0;
        updated.upvotes = upvotes;
        updated.downvotes = downvotes;
        updated.score = upvotes - downvotes;
        await updated.save();
        return updated;
    }

    async dislikeArgument(argumentId: string, userId: string): Promise<ArgumentDocument> {
        if (!argumentId || !userId) {
            throw new BadRequestException('argumentId and userId are required');
        }
        const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;
        if (!userObjectId) throw new BadRequestException('Invalid userId');

        const updated = await this.argumentModel.findByIdAndUpdate(
            argumentId,
            {
                $addToSet: { downvotedBy: userObjectId },
                $pull: { upvotedBy: userObjectId },
            },
            { new: true }
        );
        if (!updated) throw new NotFoundException('Argument not found');

        const upvotes = updated.upvotedBy?.length || 0;
        const downvotes = updated.downvotedBy?.length || 0;
        updated.upvotes = upvotes;
        updated.downvotes = downvotes;
        updated.score = upvotes - downvotes;
        await updated.save();
        return updated;
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

    async updateThreadStatus(
        threadId: string,
        status: ThreadStatus,
        reason?: string,
        moderatorId?: string,
    ): Promise<DebateThreadDocument> {
        const thread = await this.debateThreadModel.findById(threadId);
        if (!thread) {
            throw new NotFoundException('Thread not found');
        }

        // Validate status transition
        const currentStatus = thread.status;
        const validTransitions = this.getValidStatusTransitions(currentStatus);
        if (!validTransitions.includes(status)) {
            throw new BadRequestException(`Cannot change status from ${currentStatus} to ${status}`);
        }

        // Require reason for rejection
        if (status === ThreadStatus.CLOSED && !reason) {
            throw new BadRequestException('Reason is required when closing a thread');
        }

        // Update thread status
        const updateData: any = { status };

        if (reason) {
            updateData.rejectionReason = reason;
        }

        if (status === ThreadStatus.ACTIVE) {
            updateData.startDate = new Date();
        } else if (status === ThreadStatus.CLOSED) {
            updateData.endDate = new Date();
            updateData.allowVoting = false;
            updateData.allowArguments = false;
        }

        const updatedThread = await this.debateThreadModel.findByIdAndUpdate(
            threadId,
            updateData,
            { new: true }
        ).populate('createdBy', 'username email firstName lastName avatar')
            .populate('moderators', 'username email firstName lastName avatar')
            .populate('modForSideA', 'username email firstName lastName avatar')
            .populate('modForSideB', 'username email firstName lastName avatar')
            .exec();

        if (!updatedThread) {
            throw new NotFoundException('Thread not found after update');
        }

        return updatedThread;
    }

    private getValidStatusTransitions(currentStatus: ThreadStatus): ThreadStatus[] {
        switch (currentStatus) {
            case ThreadStatus.DRAFT:
                return [ThreadStatus.ACTIVE, ThreadStatus.CLOSED];
            case ThreadStatus.ACTIVE:
                return [ThreadStatus.PAUSED, ThreadStatus.CLOSED, ThreadStatus.ARCHIVED];
            case ThreadStatus.PAUSED:
                return [ThreadStatus.ACTIVE, ThreadStatus.CLOSED, ThreadStatus.ARCHIVED];
            case ThreadStatus.CLOSED:
                return [ThreadStatus.ARCHIVED];
            case ThreadStatus.ARCHIVED:
                return []; // No transitions from archived
            default:
                return [];
        }
    }

    async replyToArgument(
        argumentId: string,
        replyData: any,
        userId: string,
    ): Promise<ArgumentDocument> {
        // Find the parent argument
        const parentArgument = await this.argumentModel.findById(argumentId)
            .populate('threadId')
            .exec();

        if (!parentArgument) {
            throw new NotFoundException('Parent argument not found');
        }

        // Check if thread allows arguments
        const thread = parentArgument.threadId as any;
        if (!thread.allowArguments) {
            throw new BadRequestException('This thread no longer accepts new arguments');
        }

        // Check if user is not the author of the parent argument
        if (parentArgument.authorId.toString() === userId) {
            throw new BadRequestException('Cannot reply to your own argument');
        }

        // Create reply argument
        const replyArgument = new this.argumentModel({
            title: replyData.title || `Phản hồi: ${parentArgument.title}`,
            content: replyData.content,
            authorId: new Types.ObjectId(userId),
            threadId: parentArgument.threadId,
            parentArgumentId: new Types.ObjectId(argumentId),
            argumentType: ArgumentType.NEUTRAL, // Replies are neutral by default
            status: ArgumentStatus.PENDING,
            source: replyData.source,
            evidenceUrls: replyData.evidenceUrls,
        });

        const savedReply = await replyArgument.save();

        // Populate the reply with author and parent argument info
        const populatedReply = await this.argumentModel.findById(savedReply._id)
            .populate('authorId', 'username email firstName lastName avatar')
            .populate('parentArgumentId', 'title content')
            .populate('threadId', 'title status')
            .exec();

        if (!populatedReply) {
            throw new NotFoundException('Reply not found after creation');
        }

        return populatedReply as ArgumentDocument;
    }

    async getArgumentReplies(
        argumentId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ items: ArgumentDocument[]; totalItems: number; page: number; limit: number }> {
        const filter = { parentArgumentId: new Types.ObjectId(argumentId) };
        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const [items, totalItems] = await Promise.all([
            this.argumentModel.find(filter)
                .populate('authorId', 'username email firstName lastName avatar')
                .populate('parentArgumentId', 'title content')
                .populate('threadId', 'title status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.argumentModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }

    // Admin Dashboard Statistics
    async getThreadStatusStats(): Promise<{
        pending: number;
        active: number;
        paused: number;
        closed: number;
        archived: number;
        total: number;
    }> {
        const [
            pending,
            active,
            paused,
            closed,
            archived,
            total
        ] = await Promise.all([
            this.debateThreadModel.countDocuments({ status: ThreadStatus.DRAFT }),
            this.debateThreadModel.countDocuments({ status: ThreadStatus.ACTIVE }),
            this.debateThreadModel.countDocuments({ status: ThreadStatus.PAUSED }),
            this.debateThreadModel.countDocuments({ status: ThreadStatus.CLOSED }),
            this.debateThreadModel.countDocuments({ status: ThreadStatus.ARCHIVED }),
            this.debateThreadModel.countDocuments(),
        ]);

        return { pending, active, paused, closed, archived, total };
    }

    async getArgumentStatusStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        flagged: number;
        total: number;
    }> {
        const [
            pending,
            approved,
            rejected,
            flagged,
            total
        ] = await Promise.all([
            this.argumentModel.countDocuments({ status: ArgumentStatus.PENDING }),
            this.argumentModel.countDocuments({ status: ArgumentStatus.APPROVED }),
            this.argumentModel.countDocuments({ status: ArgumentStatus.REJECTED }),
            this.argumentModel.countDocuments({ status: ArgumentStatus.FLAGGED }),
            this.argumentModel.countDocuments(),
        ]);

        return { pending, approved, rejected, flagged, total };
    }

    async getUserActivityStats(): Promise<{
        online: number;
        offline: number;
        busy: number;
        away: number;
        total: number;
        newUsersLast7Days: number;
        activeUsersLast24Hours: number;
    }> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const [
            online,
            offline,
            busy,
            away,
            total,
            newUsersLast7Days,
            activeUsersLast24Hours
        ] = await Promise.all([
            this.userModel.countDocuments({ status: 'ONLINE' }),
            this.userModel.countDocuments({ status: 'OFFLINE' }),
            this.userModel.countDocuments({ status: 'BUSY' }),
            this.userModel.countDocuments({ status: 'AWAY' }),
            this.userModel.countDocuments(),
            this.userModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            this.userModel.countDocuments({ lastSeen: { $gte: twentyFourHoursAgo } }),
        ]);

        return { online, offline, busy, away, total, newUsersLast7Days, activeUsersLast24Hours };
    }

    async getSystemOverviewStats(): Promise<{
        totalVotes: number;
        supportVotes: number;
        opposeVotes: number;
        totalLikes: number;
        totalDislikes: number;
        totalReplies: number;
        totalViews: number;
    }> {
        const [
            totalVotes,
            supportVotes,
            opposeVotes,
            totalLikes,
            totalDislikes,
            totalReplies,
            totalViews
        ] = await Promise.all([
            this.voteModel.countDocuments(),
            this.voteModel.countDocuments({ voteType: 'SUPPORT' }),
            this.voteModel.countDocuments({ voteType: 'OPPOSE' }),
            this.argumentModel.aggregate([
                { $group: { _id: null, total: { $sum: '$upvotes' } } }
            ]).then(result => result[0]?.total || 0),
            this.argumentModel.aggregate([
                { $group: { _id: null, total: { $sum: '$downvotes' } } }
            ]).then(result => result[0]?.total || 0),
            this.argumentModel.countDocuments({ parentArgumentId: { $exists: true } }),
            this.argumentModel.aggregate([
                { $group: { _id: null, total: { $sum: '$viewCount' } } }
            ]).then(result => result[0]?.total || 0),
        ]);

        return { totalVotes, supportVotes, opposeVotes, totalLikes, totalDislikes, totalReplies, totalViews };
    }

    async getRecentActivity(limit: number = 10): Promise<Array<{
        id: string;
        type: string;
        title: string;
        user: string;
        timestamp: Date;
        status?: string;
    }>> {
        const activities: Array<{
            id: string;
            type: string;
            title: string;
            user: string;
            timestamp: Date;
            status?: string;
        }> = [];

        // Recent threads
        const recentThreads = await this.debateThreadModel
            .find()
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();

        recentThreads.forEach((thread: any) => {
            activities.push({
                id: thread._id.toString(),
                type: 'thread_created',
                title: thread.title,
                user: thread.createdBy?.username || 'Unknown',
                timestamp: thread.createdAt,
                status: thread.status,
            });
        });

        // Recent arguments
        const recentArguments = await this.argumentModel
            .find()
            .populate('authorId', 'username')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();

        recentArguments.forEach((argument: any) => {
            activities.push({
                id: argument._id.toString(),
                type: 'argument_created',
                title: argument.title,
                user: argument.authorId?.username || 'Unknown',
                timestamp: argument.createdAt,
                status: argument.status,
            });
        });

        // Recent votes
        const recentVotes = await this.voteModel
            .find()
            .populate('userId', 'username')
            .sort({ votedAt: -1 })
            .limit(limit)
            .exec();

        recentVotes.forEach((vote: any) => {
            activities.push({
                id: vote._id.toString(),
                type: 'vote_cast',
                title: `Vote ${vote.voteType}`,
                user: vote.userId?.username || 'Unknown',
                timestamp: vote.votedAt,
                status: vote.voteType,
            });
        });

        // Sort by timestamp and return top activities
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    async getAdminDashboard(): Promise<{
        threadStats: any;
        argumentStats: any;
        userStats: any;
        systemStats: any;
        recentActivity: any[];
        lastUpdated: Date;
    }> {
        const [
            threadStats,
            argumentStats,
            userStats,
            systemStats,
            recentActivity
        ] = await Promise.all([
            this.getThreadStatusStats(),
            this.getArgumentStatusStats(),
            this.getUserActivityStats(),
            this.getSystemOverviewStats(),
            this.getRecentActivity(15),
        ]);

        return {
            threadStats,
            argumentStats,
            userStats,
            systemStats,
            recentActivity,
            lastUpdated: new Date(),
        };
    }

    // Moderator Dashboard Statistics
    async getModeratorDashboard(): Promise<{
        assignedThreads: number;
        pendingModeration: number;
        moderatedToday: number;
        totalModerated: number;
        recentActivity: any[];
        lastUpdated: Date;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            assignedThreads,
            pendingModeration,
            moderatedToday,
            totalModerated,
            recentActivity
        ] = await Promise.all([
            this.debateThreadModel.countDocuments({
                $or: [
                    { moderators: { $exists: true, $ne: [] } },
                    { modForSideA: { $exists: true } },
                    { modForSideB: { $exists: true } }
                ]
            }),
            this.argumentModel.countDocuments({ status: ArgumentStatus.PENDING }),
            this.argumentModel.countDocuments({
                status: { $in: [ArgumentStatus.APPROVED, ArgumentStatus.REJECTED] },
                moderatedAt: { $gte: today }
            }),
            this.argumentModel.countDocuments({
                status: { $in: [ArgumentStatus.APPROVED, ArgumentStatus.REJECTED] }
            }),
            this.getRecentActivity(10)
        ]);

        return {
            assignedThreads,
            pendingModeration,
            moderatedToday,
            totalModerated,
            recentActivity,
            lastUpdated: new Date(),
        };
    }

    async getAssignedThreads(
        moderatorId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ items: DebateThreadDocument[]; totalItems: number; page: number; limit: number }> {
        const filter = {
            $or: [
                { moderators: new Types.ObjectId(moderatorId) },
                { modForSideA: new Types.ObjectId(moderatorId) },
                { modForSideB: new Types.ObjectId(moderatorId) }
            ]
        };

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const [items, totalItems] = await Promise.all([
            this.debateThreadModel.find(filter)
                .populate('createdBy', 'username email firstName lastName avatar')
                .populate('moderators', 'username email firstName lastName avatar')
                .populate('modForSideA', 'username email firstName lastName avatar')
                .populate('modForSideB', 'username email firstName lastName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.debateThreadModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }

    async getPendingModeration(
        moderatorId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ items: ArgumentDocument[]; totalItems: number; page: number; limit: number }> {
        // Get threads assigned to this moderator
        const assignedThreads = await this.debateThreadModel.find({
            $or: [
                { moderators: new Types.ObjectId(moderatorId) },
                { modForSideA: new Types.ObjectId(moderatorId) },
                { modForSideB: new Types.ObjectId(moderatorId) }
            ]
        }).select('_id').exec();

        const threadIds = assignedThreads.map(thread => thread._id);

        const filter = {
            threadId: { $in: threadIds },
            status: ArgumentStatus.PENDING // This method specifically gets pending arguments
        };

        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const [items, totalItems] = await Promise.all([
            this.argumentModel.find(filter)
                .populate('authorId', 'username email firstName lastName avatar')
                .populate('threadId', 'title status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.argumentModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }

    async getModerationStats(moderatorId: string): Promise<{
        totalModerated: number;
        approvedToday: number;
        rejectedToday: number;
        pendingCount: number;
        moderationRate: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalModerated,
            approvedToday,
            rejectedToday,
            pendingCount
        ] = await Promise.all([
            this.argumentModel.countDocuments({
                moderatedBy: new Types.ObjectId(moderatorId),
                status: { $in: [ArgumentStatus.APPROVED, ArgumentStatus.REJECTED] }
            }),
            this.argumentModel.countDocuments({
                moderatedBy: new Types.ObjectId(moderatorId),
                status: ArgumentStatus.APPROVED,
                moderatedAt: { $gte: today }
            }),
            this.argumentModel.countDocuments({
                moderatedBy: new Types.ObjectId(moderatorId),
                status: ArgumentStatus.REJECTED,
                moderatedAt: { $gte: today }
            }),
            this.argumentModel.countDocuments({
                moderatedBy: new Types.ObjectId(moderatorId),
                status: ArgumentStatus.PENDING
            })
        ]);

        const moderationRate = totalModerated > 0 ?
            Math.round((approvedToday / (approvedToday + rejectedToday)) * 100) : 0;

        return {
            totalModerated,
            approvedToday,
            rejectedToday,
            pendingCount,
            moderationRate: isNaN(moderationRate) ? 0 : moderationRate,
        };
    }

    // Get arguments from threads assigned to moderator
    async getAssignedThreadArguments(
        moderatorId: string,
        isAdmin: boolean = false,
        query?: {
            status?: ArgumentStatus;
            argumentType?: ArgumentType;
            threadId?: string;
            search?: string;
            page?: number;
            limit?: number;
            sort?: string;
            includeThread?: boolean;
        },
    ): Promise<{ items: ArgumentDocument[]; totalItems: number; page: number; limit: number }> {
        const page = Number(query?.page) || 1;
        const limit = Math.min(Number(query?.limit) || 20, 100);
        const skip = Math.max(0, (page - 1) * limit);

        // Parse sort parameter
        let sort: any = { createdAt: -1 }; // Default sort
        if (query?.sort) {
            const [field, order] = query.sort.split(':');
            sort = { [field]: parseInt(order) || -1 };
        }

        // Base filter for arguments
        const baseFilter: any = {};
        if (query?.status) {
            baseFilter.status = query.status;
        }
        if (query?.argumentType) {
            baseFilter.argumentType = query.argumentType;
        }
        if (query?.search) {
            baseFilter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { content: { $regex: query.search, $options: 'i' } },
            ];
        }

        // If specific threadId is provided, filter by that
        if (query?.threadId) {
            baseFilter.threadId = Types.ObjectId.isValid(query.threadId)
                ? new Types.ObjectId(query.threadId)
                : query.threadId;
        } else {
            // Get threads assigned to this moderator
            const modObjectId = Types.ObjectId.isValid(moderatorId)
                ? new Types.ObjectId(moderatorId)
                : undefined;

            const threadFilter: any = modObjectId
                ? {
                    $or: [
                        { modForSideA: modObjectId },
                        { modForSideB: modObjectId },
                        { moderators: modObjectId },
                        ...(isAdmin ? [{ createdBy: modObjectId }] : []),
                    ],
                }
                : {
                    $or: [
                        { modForSideA: moderatorId },
                        { modForSideB: moderatorId },
                        { moderators: { $in: [moderatorId] } },
                        ...(isAdmin ? [{ createdBy: moderatorId }] : []),
                    ],
                };

            const threads = await this.debateThreadModel
                .find(threadFilter)
                .select('_id')
                .lean();

            if (!threads.length) {
                return { items: [], totalItems: 0, page, limit };
            }

            const threadIds = threads.map((t: any) => t._id);
            baseFilter.threadId = { $in: threadIds };
        }

        // Execute query
        const populateOptions = [
            { path: 'authorId', select: 'username email firstName lastName avatar' },
            { path: 'moderatedBy', select: 'username email firstName lastName avatar' },
        ];

        // Include thread details if requested
        if (query?.includeThread) {
            populateOptions.push({
                path: 'threadId',
                select: 'title description status moderators modForSideA modForSideB createdBy requireModeration'
            } as any);
        }

        const [items, totalItems] = await Promise.all([
            this.argumentModel
                .find(baseFilter)
                .populate(populateOptions)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.argumentModel.countDocuments(baseFilter),
        ]);

        return { items, totalItems, page, limit };
    }
}