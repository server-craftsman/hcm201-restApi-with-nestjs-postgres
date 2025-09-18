import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TopicRepositoryInterface } from '../domain/repositories/topic.repository.interface';
import { Topic } from '../domain/entities/topic.entity';

@Injectable()
export class TopicRepository implements TopicRepositoryInterface {
    constructor(private readonly prisma: PrismaService) { }

    async create(topic: Topic): Promise<Topic> {
        const created = await this.prisma.topic.create({
            data: {
                title: topic.title,
                description: topic.description,
                ownerId: topic.ownerId,
            },
        });

        return new Topic(
            created.id,
            created.title,
            created.description,
            created.ownerId,
            created.createdAt,
        );
    }

    async findById(id: string): Promise<Topic | null> {
        const topic = await this.prisma.topic.findUnique({
            where: { id },
        });

        if (!topic) return null;

        return new Topic(
            topic.id,
            topic.title,
            topic.description,
            topic.ownerId,
            topic.createdAt,
        );
    }

    async findAll(): Promise<Topic[]> {
        const topics = await this.prisma.topic.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return topics.map(
            (topic) =>
                new Topic(
                    topic.id,
                    topic.title,
                    topic.description,
                    topic.ownerId,
                    topic.createdAt,
                ),
        );
    }

    async findByOwnerId(ownerId: string): Promise<Topic[]> {
        const topics = await this.prisma.topic.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });

        return topics.map(
            (topic) =>
                new Topic(
                    topic.id,
                    topic.title,
                    topic.description,
                    topic.ownerId,
                    topic.createdAt,
                ),
        );
    }

    async update(id: string, topic: Partial<Topic>): Promise<Topic> {
        const updated = await this.prisma.topic.update({
            where: { id },
            data: {
                ...(topic.title && { title: topic.title }),
                ...(topic.description !== undefined && { description: topic.description }),
            },
        });

        return new Topic(
            updated.id,
            updated.title,
            updated.description,
            updated.ownerId,
            updated.createdAt,
        );
    }

    async delete(id: string): Promise<void> {
        await this.prisma.topic.delete({
            where: { id },
        });
    }
}
