import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { TopicRepositoryInterface } from './domain/repositories/topic.repository.interface';
import { QuestionRepositoryInterface } from './domain/repositories/question.repository.interface';
import { ArgumentRepositoryInterface } from './domain/repositories/argument.repository.interface';
import { Topic } from './domain/entities/topic.entity';
import { Question } from './domain/entities/question.entity';
import { Argument } from './domain/entities/argument.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateArgumentDto } from './dto/create-argument.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateArgumentDto } from './dto/update-argument.dto';

@Injectable()
export class DebateService {
    constructor(
        @Inject('TopicRepositoryInterface')
        private readonly topicRepository: TopicRepositoryInterface,
        @Inject('QuestionRepositoryInterface')
        private readonly questionRepository: QuestionRepositoryInterface,
        @Inject('ArgumentRepositoryInterface')
        private readonly argumentRepository: ArgumentRepositoryInterface,
    ) { }

    // Topic methods
    async createTopic(createTopicDto: CreateTopicDto, ownerId: string): Promise<Topic> {
        const topic = Topic.create(
            createTopicDto.title,
            createTopicDto.description || null,
            ownerId,
        );

        return await this.topicRepository.create(topic);
    }

    async findAllTopics(): Promise<Topic[]> {
        return await this.topicRepository.findAll();
    }

    async findTopicById(id: string): Promise<Topic> {
        const topic = await this.topicRepository.findById(id);
        if (!topic) {
            throw new NotFoundException(`Topic with ID ${id} not found`);
        }
        return topic;
    }

    async findTopicsByOwner(ownerId: string): Promise<Topic[]> {
        return await this.topicRepository.findByOwnerId(ownerId);
    }

    async updateTopic(id: string, updateTopicDto: UpdateTopicDto, userId: string): Promise<Topic> {
        const topic = await this.findTopicById(id);

        if (topic.ownerId !== userId) {
            throw new ForbiddenException('You can only update your own topics');
        }

        return await this.topicRepository.update(id, updateTopicDto);
    }

    async deleteTopic(id: string, userId: string): Promise<void> {
        const topic = await this.findTopicById(id);

        if (topic.ownerId !== userId) {
            throw new ForbiddenException('You can only delete your own topics');
        }

        await this.topicRepository.delete(id);
    }

    // Question methods
    async createQuestion(
        topicId: string,
        createQuestionDto: CreateQuestionDto,
        userId: string,
    ): Promise<Question> {
        // Verify topic exists
        await this.findTopicById(topicId);

        const question = Question.create(createQuestionDto.content, topicId);
        return await this.questionRepository.create(question);
    }

    async findQuestionsByTopic(topicId: string): Promise<Question[]> {
        // Verify topic exists
        await this.findTopicById(topicId);

        return await this.questionRepository.findByTopicId(topicId);
    }

    async findQuestionById(id: string): Promise<Question> {
        const question = await this.questionRepository.findById(id);
        if (!question) {
            throw new NotFoundException(`Question with ID ${id} not found`);
        }
        return question;
    }

    async updateQuestion(
        id: string,
        updateQuestionDto: UpdateQuestionDto,
        userId: string,
    ): Promise<Question> {
        const question = await this.findQuestionById(id);

        // For now, allow any authenticated user to update questions
        // You can add ownership logic later if needed

        return await this.questionRepository.update(id, updateQuestionDto);
    }

    async deleteQuestion(id: string, userId: string): Promise<void> {
        const question = await this.findQuestionById(id);

        // For now, allow any authenticated user to delete questions
        // You can add ownership logic later if needed

        await this.questionRepository.delete(id);
    }

    // Argument methods
    async createArgument(
        questionId: string,
        createArgumentDto: CreateArgumentDto,
        authorId: string,
    ): Promise<Argument> {
        // Verify question exists
        await this.findQuestionById(questionId);

        const argument = Argument.create(createArgumentDto.body, authorId, questionId);
        return await this.argumentRepository.create(argument);
    }

    async findArgumentsByQuestion(questionId: string): Promise<Argument[]> {
        // Verify question exists
        await this.findQuestionById(questionId);

        return await this.argumentRepository.findByQuestionId(questionId);
    }

    async findArgumentsByAuthor(authorId: string): Promise<Argument[]> {
        return await this.argumentRepository.findByAuthorId(authorId);
    }

    async findArgumentById(id: string): Promise<Argument> {
        const argument = await this.argumentRepository.findById(id);
        if (!argument) {
            throw new NotFoundException(`Argument with ID ${id} not found`);
        }
        return argument;
    }

    async updateArgument(
        id: string,
        updateArgumentDto: UpdateArgumentDto,
        userId: string,
    ): Promise<Argument> {
        const argument = await this.findArgumentById(id);

        if (argument.authorId !== userId) {
            throw new ForbiddenException('You can only update your own arguments');
        }

        return await this.argumentRepository.update(id, updateArgumentDto);
    }

    async deleteArgument(id: string, userId: string): Promise<void> {
        const argument = await this.findArgumentById(id);

        if (argument.authorId !== userId) {
            throw new ForbiddenException('You can only delete your own arguments');
        }

        await this.argumentRepository.delete(id);
    }
}
