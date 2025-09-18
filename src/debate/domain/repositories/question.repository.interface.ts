import { Question } from '../entities/question.entity';

export interface QuestionRepositoryInterface {
    create(question: Question): Promise<Question>;
    findById(id: string): Promise<Question | null>;
    findByTopicId(topicId: string): Promise<Question[]>;
    update(id: string, question: Partial<Question>): Promise<Question>;
    delete(id: string): Promise<void>;
}
