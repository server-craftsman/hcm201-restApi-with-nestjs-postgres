import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionRepositoryInterface } from '../domain/repositories/question.repository.interface';
import { Question } from '../domain/entities/question.entity';

@Injectable()
export class QuestionRepository implements QuestionRepositoryInterface {
    constructor(private readonly prisma: PrismaService) { }

    async create(question: Question): Promise<Question> {
        const created = await this.prisma.question.create({
            data: {
                content: question.content,
                topicId: question.topicId,
            },
        });

        return new Question(
            created.id,
            created.content,
            created.topicId,
            created.createdAt,
        );
    }

    async findById(id: string): Promise<Question | null> {
        const question = await this.prisma.question.findUnique({
            where: { id },
        });

        if (!question) return null;

        return new Question(
            question.id,
            question.content,
            question.topicId,
            question.createdAt,
        );
    }

    async findByTopicId(topicId: string): Promise<Question[]> {
        const questions = await this.prisma.question.findMany({
            where: { topicId },
            orderBy: { createdAt: 'desc' },
        });

        return questions.map(
            (question) =>
                new Question(
                    question.id,
                    question.content,
                    question.topicId,
                    question.createdAt,
                ),
        );
    }

    async update(id: string, question: Partial<Question>): Promise<Question> {
        const updated = await this.prisma.question.update({
            where: { id },
            data: {
                ...(question.content && { content: question.content }),
            },
        });

        return new Question(
            updated.id,
            updated.content,
            updated.topicId,
            updated.createdAt,
        );
    }

    async delete(id: string): Promise<void> {
        await this.prisma.question.delete({
            where: { id },
        });
    }
}
