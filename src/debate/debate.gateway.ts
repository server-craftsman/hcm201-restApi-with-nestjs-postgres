import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DebateService } from './debate.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateArgumentDto } from './dto/create-argument.dto';

@WebSocketGateway({
    namespace: '/debate',
    cors: {
        origin: '*',
    },
})
export class DebateGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly debateService: DebateService) { }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinTopic')
    async handleJoinTopic(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { topicId: string },
    ) {
        const { topicId } = data;
        client.join(`topic:${topicId}`);
        client.emit('joinedTopic', { topicId });
        console.log(`Client ${client.id} joined topic ${topicId}`);
    }

    @SubscribeMessage('leaveTopic')
    async handleLeaveTopic(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { topicId: string },
    ) {
        const { topicId } = data;
        client.leave(`topic:${topicId}`);
        client.emit('leftTopic', { topicId });
        console.log(`Client ${client.id} left topic ${topicId}`);
    }

    @SubscribeMessage('newQuestion')
    async handleNewQuestion(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { topicId: string; question: CreateQuestionDto; userId: string },
    ) {
        try {
            const { topicId, question, userId } = data;

            // Create the question
            const createdQuestion = await this.debateService.createQuestion(
                topicId,
                question,
                userId,
            );

            // Broadcast to all clients in the topic room
            this.server.to(`topic:${topicId}`).emit('questionAdded', {
                question: createdQuestion,
                topicId,
            });

            console.log(`New question added to topic ${topicId}: ${createdQuestion.id}`);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('newArgument')
    async handleNewArgument(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { questionId: string; argument: CreateArgumentDto; userId: string },
    ) {
        try {
            const { questionId, argument, userId } = data;

            // Create the argument
            const createdArgument = await this.debateService.createArgument(
                questionId,
                argument,
                userId,
            );

            // Get the question to find the topic
            const question = await this.debateService.findQuestionById(questionId);

            // Broadcast to all clients in the topic room
            this.server.to(`topic:${question.topicId}`).emit('argumentAdded', {
                argument: createdArgument,
                questionId,
                topicId: question.topicId,
            });

            console.log(`New argument added to question ${questionId}: ${createdArgument.id}`);
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { topicId: string; userId: string; isTyping: boolean },
    ) {
        const { topicId, userId, isTyping } = data;

        // Broadcast typing status to other clients in the topic room
        client.to(`topic:${topicId}`).emit('userTyping', {
            userId,
            isTyping,
        });
    }

    // Helper method to broadcast topic updates
    async broadcastTopicUpdate(topicId: string, update: any) {
        this.server.to(`topic:${topicId}`).emit('topicUpdated', {
            topicId,
            update,
        });
    }

    // Helper method to broadcast question updates
    async broadcastQuestionUpdate(questionId: string, update: any) {
        const question = await this.debateService.findQuestionById(questionId);
        this.server.to(`topic:${question.topicId}`).emit('questionUpdated', {
            questionId,
            topicId: question.topicId,
            update,
        });
    }

    // Helper method to broadcast argument updates
    async broadcastArgumentUpdate(argumentId: string, update: any) {
        const argument = await this.debateService.findArgumentById(argumentId);
        const question = await this.debateService.findQuestionById(argument.questionId);

        this.server.to(`topic:${question.topicId}`).emit('argumentUpdated', {
            argumentId,
            questionId: argument.questionId,
            topicId: question.topicId,
            update,
        });
    }
}
