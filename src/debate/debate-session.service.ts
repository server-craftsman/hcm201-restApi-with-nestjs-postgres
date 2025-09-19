import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebateSessionStatus, ParticipantRole } from '@prisma/client';
import {
    CreateDebateSessionDto,
    UpdateDebateSessionDto,
    JoinDebateSessionDto,
    DebateSessionResponseDto,
    DebateSessionParticipantResponseDto
} from './dto/debate-session.dto';

@Injectable()
export class DebateSessionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo debate session mới
     */
    async createSession(userId: string, createDto: CreateDebateSessionDto): Promise<DebateSessionResponseDto> {
        const { topicId, title, description, startTime, endTime, timeLimit, maxParticipants } = createDto;

        // Kiểm tra topic có tồn tại không
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
        });

        if (!topic) {
            throw new NotFoundException('Topic not found');
        }

        // Kiểm tra thời gian
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : null;

        if (end && end <= start) {
            throw new BadRequestException('End time must be after start time');
        }

        if (start <= new Date()) {
            throw new BadRequestException('Start time must be in the future');
        }

        const session = await this.prisma.debateSession.create({
            data: {
                topicId,
                title,
                description,
                startTime: start,
                endTime: end,
                timeLimit,
                maxParticipants: maxParticipants || 10,
                status: DebateSessionStatus.SCHEDULED,
            },
        });

        // Tự động thêm người tạo làm moderator
        await this.prisma.debateSessionParticipant.create({
            data: {
                sessionId: session.id,
                userId,
                role: ParticipantRole.MODERATOR,
            },
        });

        return this.formatSessionResponse(session);
    }

    /**
     * Cập nhật debate session
     */
    async updateSession(sessionId: string, userId: string, updateDto: UpdateDebateSessionDto): Promise<DebateSessionResponseDto> {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                participants: {
                    where: { userId },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        // Kiểm tra quyền (chỉ moderator hoặc admin mới được update)
        const participant = session.participants[0];
        if (!participant || participant.role !== ParticipantRole.MODERATOR) {
            throw new ForbiddenException('Only moderators can update debate sessions');
        }

        // Kiểm tra trạng thái session
        if (session.status === DebateSessionStatus.ENDED || session.status === DebateSessionStatus.CANCELLED) {
            throw new BadRequestException('Cannot update ended or cancelled sessions');
        }

        const updatedSession = await this.prisma.debateSession.update({
            where: { id: sessionId },
            data: updateDto,
        });

        return this.formatSessionResponse(updatedSession);
    }

    /**
     * Tham gia debate session
     */
    async joinSession(sessionId: string, userId: string, joinDto: JoinDebateSessionDto = {}): Promise<DebateSessionParticipantResponseDto> {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                participants: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        // Kiểm tra session có đang mở không
        if (session.status !== DebateSessionStatus.SCHEDULED && session.status !== DebateSessionStatus.ACTIVE) {
            throw new BadRequestException('Session is not open for joining');
        }

        // Kiểm tra đã tham gia chưa
        const existingParticipant = session.participants.find(p => p.userId === userId);
        if (existingParticipant) {
            throw new BadRequestException('User already joined this session');
        }

        // Kiểm tra số lượng tham gia
        if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
            throw new BadRequestException('Session is full');
        }

        const participant = await this.prisma.debateSessionParticipant.create({
            data: {
                sessionId,
                userId,
                role: joinDto.role || ParticipantRole.PARTICIPANT,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        });

        return this.formatParticipantResponse(participant);
    }

    /**
     * Rời khỏi debate session
     */
    async leaveSession(sessionId: string, userId: string): Promise<void> {
        const participant = await this.prisma.debateSessionParticipant.findUnique({
            where: {
                sessionId_userId: {
                    sessionId,
                    userId,
                },
            },
        });

        if (!participant) {
            throw new NotFoundException('User is not a participant of this session');
        }

        // Không cho phép moderator rời khỏi session
        if (participant.role === ParticipantRole.MODERATOR) {
            throw new BadRequestException('Moderators cannot leave the session');
        }

        await this.prisma.debateSessionParticipant.update({
            where: {
                sessionId_userId: {
                    sessionId,
                    userId,
                },
            },
            data: {
                leftAt: new Date(),
            },
        });
    }

    /**
     * Bắt đầu debate session
     */
    async startSession(sessionId: string, userId: string): Promise<DebateSessionResponseDto> {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                participants: {
                    where: { userId },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        // Kiểm tra quyền
        const participant = session.participants[0];
        if (!participant || participant.role !== ParticipantRole.MODERATOR) {
            throw new ForbiddenException('Only moderators can start sessions');
        }

        // Kiểm tra trạng thái
        if (session.status !== DebateSessionStatus.SCHEDULED) {
            throw new BadRequestException('Session can only be started from scheduled status');
        }

        const updatedSession = await this.prisma.debateSession.update({
            where: { id: sessionId },
            data: {
                status: DebateSessionStatus.ACTIVE,
                startTime: new Date(), // Cập nhật thời gian bắt đầu thực tế
            },
        });

        return this.formatSessionResponse(updatedSession);
    }

    /**
     * Kết thúc debate session
     */
    async endSession(sessionId: string, userId: string): Promise<DebateSessionResponseDto> {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                participants: {
                    where: { userId },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        // Kiểm tra quyền
        const participant = session.participants[0];
        if (!participant || participant.role !== ParticipantRole.MODERATOR) {
            throw new ForbiddenException('Only moderators can end sessions');
        }

        const updatedSession = await this.prisma.debateSession.update({
            where: { id: sessionId },
            data: {
                status: DebateSessionStatus.ENDED,
                endTime: new Date(),
            },
        });

        return this.formatSessionResponse(updatedSession);
    }

    /**
     * Lấy danh sách debate sessions
     */
    async getSessions(status?: DebateSessionStatus, limit: number = 20, offset: number = 0): Promise<DebateSessionResponseDto[]> {
        const sessions = await this.prisma.debateSession.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                topic: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        return sessions.map(session => this.formatSessionResponse(session));
    }

    /**
     * Lấy chi tiết debate session
     */
    async getSessionById(sessionId: string): Promise<DebateSessionResponseDto> {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                topic: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                                avatar: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        return this.formatSessionResponse(session);
    }

    /**
     * Lấy danh sách participants của session
     */
    async getSessionParticipants(sessionId: string): Promise<DebateSessionParticipantResponseDto[]> {
        const participants = await this.prisma.debateSessionParticipant.findMany({
            where: { sessionId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });

        return participants.map(participant => this.formatParticipantResponse(participant));
    }

    /**
     * Kiểm tra thời gian còn lại để trả lời
     */
    async getTimeRemaining(sessionId: string, userId: string): Promise<{ timeRemaining: number; canRespond: boolean }> {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        if (!session.timeLimit) {
            return { timeRemaining: -1, canRespond: true }; // Không giới hạn thời gian
        }

        // Lấy lần trả lời cuối cùng của user trong session này
        const lastArgument = await this.prisma.argument.findFirst({
            where: {
                authorId: userId,
                question: {
                    topic: {
                        debateSessions: {
                            some: { id: sessionId },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!lastArgument) {
            return { timeRemaining: session.timeLimit * 60, canRespond: true }; // Chưa trả lời lần nào
        }

        const timeSinceLastResponse = Math.floor((Date.now() - lastArgument.createdAt.getTime()) / 1000);
        const timeRemaining = (session.timeLimit * 60) - timeSinceLastResponse;

        return {
            timeRemaining: Math.max(0, timeRemaining),
            canRespond: timeRemaining <= 0,
        };
    }

    /**
     * Format session response
     */
    private formatSessionResponse(session: any): DebateSessionResponseDto {
        return {
            id: session.id,
            topicId: session.topicId,
            title: session.title,
            description: session.description,
            status: session.status,
            startTime: session.startTime,
            endTime: session.endTime,
            timeLimit: session.timeLimit,
            maxParticipants: session.maxParticipants,
            currentParticipants: session._count?.participants || 0,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }

    /**
     * Format participant response
     */
    private formatParticipantResponse(participant: any): DebateSessionParticipantResponseDto {
        return {
            id: participant.id,
            sessionId: participant.sessionId,
            userId: participant.userId,
            role: participant.role,
            joinedAt: participant.joinedAt,
            leftAt: participant.leftAt,
            user: {
                id: participant.user.id,
                username: participant.user.username,
                fullName: participant.user.fullName,
                avatar: participant.user.avatar,
            },
        };
    }
}
