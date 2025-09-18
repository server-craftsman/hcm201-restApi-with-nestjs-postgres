import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArgumentRepositoryInterface } from '../domain/repositories/argument.repository.interface';
import { Argument } from '../domain/entities/argument.entity';

@Injectable()
export class ArgumentRepository implements ArgumentRepositoryInterface {
    constructor(private readonly prisma: PrismaService) { }

    async create(argument: Argument): Promise<Argument> {
        const created = await this.prisma.argument.create({
            data: {
                body: argument.body,
                authorId: argument.authorId,
                questionId: argument.questionId,
            },
        });

        return new Argument(
            created.id,
            created.body,
            created.authorId,
            created.questionId,
            created.createdAt,
        );
    }

    async findById(id: string): Promise<Argument | null> {
        const argument = await this.prisma.argument.findUnique({
            where: { id },
        });

        if (!argument) return null;

        return new Argument(
            argument.id,
            argument.body,
            argument.authorId,
            argument.questionId,
            argument.createdAt,
        );
    }

    async findByQuestionId(questionId: string): Promise<Argument[]> {
        const debateArguments = await this.prisma.argument.findMany({
            where: { questionId },
            orderBy: { createdAt: 'asc' },
        });

        return debateArguments.map(
            (argument) =>
                new Argument(
                    argument.id,
                    argument.body,
                    argument.authorId,
                    argument.questionId,
                    argument.createdAt,
                ),
        );
    }

    async findByAuthorId(authorId: string): Promise<Argument[]> {
        const debateArguments = await this.prisma.argument.findMany({
            where: { authorId },
            orderBy: { createdAt: 'desc' },
        });

        return debateArguments.map(
            (argument) =>
                new Argument(
                    argument.id,
                    argument.body,
                    argument.authorId,
                    argument.questionId,
                    argument.createdAt,
                ),
        );
    }

    async update(id: string, argument: Partial<Argument>): Promise<Argument> {
        const updated = await this.prisma.argument.update({
            where: { id },
            data: {
                ...(argument.body && { body: argument.body }),
            },
        });

        return new Argument(
            updated.id,
            updated.body,
            updated.authorId,
            updated.questionId,
            updated.createdAt,
        );
    }

    async delete(id: string): Promise<void> {
        await this.prisma.argument.delete({
            where: { id },
        });
    }
}
