import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebateSessionStatus } from '@prisma/client';
import {
    CreateEvaluationDto,
    UpdateEvaluationDto,
    EvaluationResponseDto,
    DebateStatsResponseDto
} from './dto/evaluation.dto';

@Injectable()
export class EvaluationService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo đánh giá cho participant
     */
    async createEvaluation(evaluatorId: string, createDto: CreateEvaluationDto): Promise<EvaluationResponseDto> {
        const { sessionId, participantId, score, feedback, criteria } = createDto;

        // Kiểm tra session có tồn tại và đã kết thúc chưa
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                participants: {
                    where: { userId: evaluatorId },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        if (session.status !== DebateSessionStatus.ENDED) {
            throw new BadRequestException('Can only evaluate after session ends');
        }

        // Kiểm tra evaluator có tham gia session không
        const evaluatorParticipant = session.participants[0];
        if (!evaluatorParticipant) {
            throw new ForbiddenException('You must be a participant to evaluate');
        }

        // Kiểm tra participant có tồn tại trong session không
        const participant = await this.prisma.debateSessionParticipant.findUnique({
            where: {
                sessionId_userId: {
                    sessionId,
                    userId: participantId,
                },
            },
        });

        if (!participant) {
            throw new NotFoundException('Participant not found in this session');
        }

        // Không cho phép tự đánh giá
        if (evaluatorId === participantId) {
            throw new BadRequestException('Cannot evaluate yourself');
        }

        // Kiểm tra đã đánh giá chưa
        const existingEvaluation = await this.prisma.debateEvaluation.findUnique({
            where: {
                sessionId_evaluatorId_participantId: {
                    sessionId,
                    evaluatorId,
                    participantId,
                },
            },
        });

        if (existingEvaluation) {
            throw new BadRequestException('You have already evaluated this participant');
        }

        const evaluation = await this.prisma.debateEvaluation.create({
            data: {
                sessionId,
                evaluatorId,
                participantId,
                score,
                feedback,
                criteria,
            },
            include: {
                evaluator: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        });

        return this.formatEvaluationResponse(evaluation);
    }

    /**
     * Cập nhật đánh giá
     */
    async updateEvaluation(evaluationId: string, evaluatorId: string, updateDto: UpdateEvaluationDto): Promise<EvaluationResponseDto> {
        const evaluation = await this.prisma.debateEvaluation.findUnique({
            where: { id: evaluationId },
        });

        if (!evaluation) {
            throw new NotFoundException('Evaluation not found');
        }

        if (evaluation.evaluatorId !== evaluatorId) {
            throw new ForbiddenException('You can only update your own evaluations');
        }

        const updatedEvaluation = await this.prisma.debateEvaluation.update({
            where: { id: evaluationId },
            data: updateDto,
            include: {
                evaluator: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        });

        return this.formatEvaluationResponse(updatedEvaluation);
    }

    /**
     * Xóa đánh giá
     */
    async deleteEvaluation(evaluationId: string, evaluatorId: string): Promise<void> {
        const evaluation = await this.prisma.debateEvaluation.findUnique({
            where: { id: evaluationId },
        });

        if (!evaluation) {
            throw new NotFoundException('Evaluation not found');
        }

        if (evaluation.evaluatorId !== evaluatorId) {
            throw new ForbiddenException('You can only delete your own evaluations');
        }

        await this.prisma.debateEvaluation.delete({
            where: { id: evaluationId },
        });
    }

    /**
     * Lấy đánh giá của một participant trong session
     */
    async getParticipantEvaluations(sessionId: string, participantId: string): Promise<EvaluationResponseDto[]> {
        const evaluations = await this.prisma.debateEvaluation.findMany({
            where: {
                sessionId,
                participantId,
            },
            include: {
                evaluator: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return evaluations.map(evaluation => this.formatEvaluationResponse(evaluation));
    }

    /**
     * Lấy đánh giá của một evaluator trong session
     */
    async getEvaluatorEvaluations(sessionId: string, evaluatorId: string): Promise<EvaluationResponseDto[]> {
        const evaluations = await this.prisma.debateEvaluation.findMany({
            where: {
                sessionId,
                evaluatorId,
            },
            include: {
                evaluator: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return evaluations.map(evaluation => this.formatEvaluationResponse(evaluation));
    }

    /**
     * Lấy thống kê đánh giá của session
     */
    async getSessionEvaluationStats(sessionId: string) {
        const session = await this.prisma.debateSession.findUnique({
            where: { id: sessionId },
            include: {
                evaluations: {
                    include: {
                        evaluator: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Debate session not found');
        }

        const evaluations = session.evaluations;
        const participants = session.participants;

        // Tính điểm trung bình
        const averageScore = evaluations.length > 0
            ? evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length
            : 0;

        // Thống kê theo criteria
        const criteriaStats: Record<string, number> = {};
        evaluations.forEach(evaluation => {
            if (evaluation.criteria) {
                Object.entries(evaluation.criteria as Record<string, number>).forEach(([key, value]) => {
                    criteriaStats[key] = (criteriaStats[key] || 0) + value;
                });
            }
        });

        // Tính điểm trung bình cho từng criteria
        Object.keys(criteriaStats).forEach(key => {
            criteriaStats[key] = criteriaStats[key] / evaluations.length;
        });

        // Điểm của từng participant
        const participantScores = participants.map(participant => {
            const participantEvaluations = evaluations.filter(evaluation => evaluation.participantId === participant.userId);
            const avgScore = participantEvaluations.length > 0
                ? participantEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / participantEvaluations.length
                : 0;

            return {
                participantId: participant.userId,
                username: participant.user.username,
                fullName: participant.user.fullName,
                averageScore: Math.round(avgScore * 100) / 100,
                evaluationCount: participantEvaluations.length,
            };
        });

        return {
            sessionId,
            totalEvaluations: evaluations.length,
            totalParticipants: participants.length,
            averageScore: Math.round(averageScore * 100) / 100,
            criteriaStats,
            participantScores: participantScores.sort((a, b) => b.averageScore - a.averageScore),
        };
    }

    /**
     * Lấy thống kê tổng quan của hệ thống
     */
    async getSystemStats(): Promise<DebateStatsResponseDto> {
        const [
            totalTopics,
            totalQuestions,
            totalArguments,
            totalSessions,
            activeSessions,
            totalVotes,
            totalEvaluations,
            averageScoreResult,
        ] = await Promise.all([
            this.prisma.topic.count(),
            this.prisma.question.count(),
            this.prisma.argument.count(),
            this.prisma.debateSession.count(),
            this.prisma.debateSession.count({
                where: { status: DebateSessionStatus.ACTIVE },
            }),
            this.prisma.vote.count(),
            this.prisma.debateEvaluation.count(),
            this.prisma.debateEvaluation.aggregate({
                _avg: { score: true },
            }),
        ]);

        return {
            totalTopics,
            totalQuestions,
            totalArguments,
            totalSessions,
            activeSessions,
            totalVotes,
            totalEvaluations,
            averageScore: averageScoreResult._avg.score || 0,
        };
    }

    /**
     * Lấy top participants có điểm cao nhất
     */
    async getTopParticipants(limit: number = 10) {
        const participants = await this.prisma.debateEvaluation.groupBy({
            by: ['participantId'],
            _avg: { score: true },
            _count: { score: true },
            orderBy: { _avg: { score: 'desc' } },
            take: limit,
        });

        const participantIds = participants.map(p => p.participantId);
        const users = await this.prisma.user.findMany({
            where: { id: { in: participantIds } },
            select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
            },
        });

        return participants.map(participant => {
            const user = users.find(u => u.id === participant.participantId);
            return {
                participantId: participant.participantId,
                username: user?.username || 'Unknown',
                fullName: user?.fullName,
                avatar: user?.avatar,
                averageScore: Math.round((participant._avg.score || 0) * 100) / 100,
                evaluationCount: participant._count.score,
            };
        });
    }

    /**
     * Format evaluation response
     */
    private formatEvaluationResponse(evaluation: any): EvaluationResponseDto {
        return {
            id: evaluation.id,
            sessionId: evaluation.sessionId,
            evaluatorId: evaluation.evaluatorId,
            participantId: evaluation.participantId,
            score: evaluation.score,
            feedback: evaluation.feedback,
            criteria: evaluation.criteria,
            createdAt: evaluation.createdAt,
            evaluator: {
                id: evaluation.evaluator.id,
                username: evaluation.evaluator.username,
                fullName: evaluation.evaluator.fullName,
            },
            participant: {
                id: evaluation.participant?.id || '',
                username: evaluation.participant?.username || '',
                fullName: evaluation.participant?.fullName,
            },
        };
    }
}
