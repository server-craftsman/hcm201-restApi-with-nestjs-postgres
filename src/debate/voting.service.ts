import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoteType } from '@prisma/client';
import { CreateVoteDto, VoteResponseDto } from './dto/vote.dto';

@Injectable()
export class VotingService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Vote cho một luận điểm
     */
    async voteArgument(userId: string, createVoteDto: CreateVoteDto): Promise<VoteResponseDto> {
        const { argumentId, voteType } = createVoteDto;

        // Kiểm tra luận điểm có tồn tại không
        const argument = await this.prisma.argument.findUnique({
            where: { id: argumentId },
        });

        if (!argument) {
            throw new NotFoundException('Argument not found');
        }

        // Kiểm tra user đã vote chưa
        const existingVote = await this.prisma.vote.findUnique({
            where: {
                userId_argumentId: {
                    userId,
                    argumentId,
                },
            },
        });

        if (existingVote) {
            // Nếu vote cùng loại thì bỏ vote
            if (existingVote.voteType === voteType) {
                await this.removeVote(userId, argumentId);
                return this.getVoteResponse(existingVote, 'removed');
            } else {
                // Nếu vote khác loại thì update vote
                const updatedVote = await this.prisma.vote.update({
                    where: {
                        userId_argumentId: {
                            userId,
                            argumentId,
                        },
                    },
                    data: { voteType },
                });

                await this.updateArgumentVoteCount(argumentId);
                return this.getVoteResponse(updatedVote, 'updated');
            }
        } else {
            // Tạo vote mới
            const newVote = await this.prisma.vote.create({
                data: {
                    userId,
                    argumentId,
                    voteType,
                },
            });

            await this.updateArgumentVoteCount(argumentId);
            return this.getVoteResponse(newVote, 'created');
        }
    }

    /**
     * Bỏ vote
     */
    async removeVote(userId: string, argumentId: string): Promise<void> {
        const vote = await this.prisma.vote.findUnique({
            where: {
                userId_argumentId: {
                    userId,
                    argumentId,
                },
            },
        });

        if (vote) {
            await this.prisma.vote.delete({
                where: {
                    userId_argumentId: {
                        userId,
                        argumentId,
                    },
                },
            });

            await this.updateArgumentVoteCount(argumentId);
        }
    }

    /**
     * Lấy danh sách vote của user
     */
    async getUserVotes(userId: string): Promise<VoteResponseDto[]> {
        const votes = await this.prisma.vote.findMany({
            where: { userId },
            include: {
                argument: {
                    select: {
                        id: true,
                        body: true,
                        question: {
                            select: {
                                id: true,
                                content: true,
                                topic: {
                                    select: {
                                        id: true,
                                        title: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return votes.map(vote => ({
            id: vote.id,
            userId: vote.userId,
            argumentId: vote.argumentId,
            voteType: vote.voteType,
            createdAt: vote.createdAt,
        }));
    }

    /**
     * Lấy thống kê vote của một luận điểm
     */
    async getArgumentVoteStats(argumentId: string) {
        const argument = await this.prisma.argument.findUnique({
            where: { id: argumentId },
            select: {
                id: true,
                upvotes: true,
                downvotes: true,
                score: true,
                votes: {
                    select: {
                        voteType: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });

        if (!argument) {
            throw new NotFoundException('Argument not found');
        }

        return {
            argumentId: argument.id,
            upvotes: argument.upvotes,
            downvotes: argument.downvotes,
            score: argument.score,
            totalVotes: argument.votes.length,
            recentVoters: argument.votes.slice(0, 10).map(vote => ({
                userId: vote.user.id,
                username: vote.user.username,
                voteType: vote.voteType,
            })),
        };
    }

    /**
     * Cập nhật số lượng vote của luận điểm
     */
    private async updateArgumentVoteCount(argumentId: string): Promise<void> {
        const votes = await this.prisma.vote.findMany({
            where: { argumentId },
        });

        const upvotes = votes.filter(vote => vote.voteType === VoteType.UPVOTE).length;
        const downvotes = votes.filter(vote => vote.voteType === VoteType.DOWNVOTE).length;
        const score = upvotes - downvotes;

        await this.prisma.argument.update({
            where: { id: argumentId },
            data: {
                upvotes,
                downvotes,
                score,
            },
        });
    }

    /**
     * Tạo response cho vote
     */
    private getVoteResponse(vote: any, action: string): VoteResponseDto {
        return {
            id: vote.id,
            userId: vote.userId,
            argumentId: vote.argumentId,
            voteType: vote.voteType,
            createdAt: vote.createdAt,
        };
    }

    /**
     * Lấy top luận điểm có điểm cao nhất
     */
    async getTopArguments(limit: number = 10) {
        return await this.prisma.argument.findMany({
            orderBy: { score: 'desc' },
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                question: {
                    select: {
                        id: true,
                        content: true,
                        topic: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Lấy luận điểm trending (có nhiều vote gần đây)
     */
    async getTrendingArguments(limit: number = 10) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        return await this.prisma.argument.findMany({
            where: {
                votes: {
                    some: {
                        createdAt: {
                            gte: oneDayAgo,
                        },
                    },
                },
            },
            orderBy: [
                { score: 'desc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                question: {
                    select: {
                        id: true,
                        content: true,
                        topic: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        votes: true,
                    },
                },
            },
        });
    }
}
