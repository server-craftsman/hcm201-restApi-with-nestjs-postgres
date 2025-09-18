import { Topic } from '../entities/topic.entity';

export interface TopicRepositoryInterface {
    create(topic: Topic): Promise<Topic>;
    findById(id: string): Promise<Topic | null>;
    findAll(): Promise<Topic[]>;
    findByOwnerId(ownerId: string): Promise<Topic[]>;
    update(id: string, topic: Partial<Topic>): Promise<Topic>;
    delete(id: string): Promise<void>;
}
