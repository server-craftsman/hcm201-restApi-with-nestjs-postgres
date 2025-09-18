import { Argument } from '../entities/argument.entity';

export interface ArgumentRepositoryInterface {
    create(argument: Argument): Promise<Argument>;
    findById(id: string): Promise<Argument | null>;
    findByQuestionId(questionId: string): Promise<Argument[]>;
    findByAuthorId(authorId: string): Promise<Argument[]>;
    update(id: string, argument: Partial<Argument>): Promise<Argument>;
    delete(id: string): Promise<void>;
}
