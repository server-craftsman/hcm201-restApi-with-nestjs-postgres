import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DebateService } from './debate.service';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

@WebSocketGateway({
    namespace: '/debate',
    cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST']
    },
})
export class DebateGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private readonly debateService: DebateService,
        private readonly configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = (client.handshake.auth?.token as string)
                || (client.handshake.headers['authorization'] as string)?.replace(/^Bearer\s+/i, '');
            if (!token) {
                client.emit('error', { message: 'Unauthorized: token missing' });
                client.disconnect(true);
                return;
            }

            const secret = this.configService.get<string>('app.auth.jwt.secret') || 'default-secret';
            const payload: any = jwt.verify(token, secret);
            client.data.userId = payload?.sub || payload?.id || payload?._id;
            if (!client.data.userId) {
                client.emit('error', { message: 'Unauthorized: invalid token payload' });
                client.disconnect(true);
                return;
            }
            client.emit('connected', { userId: client.data.userId });
        } catch {
            client.emit('error', { message: 'Unauthorized' });
            client.disconnect(true);
        }
    }

    async handleDisconnect(client: Socket) {
        // No-op for now
    }

    // Rooms lifecycle
    @SubscribeMessage('joinThread')
    async onJoinThread(@ConnectedSocket() client: Socket, @MessageBody() data: { threadId: string }) {
        if (!data?.threadId) return;
        await client.join(data.threadId);
        client.emit('joinedThread', { threadId: data.threadId });
    }

    @SubscribeMessage('leaveThread')
    async onLeaveThread(@ConnectedSocket() client: Socket, @MessageBody() data: { threadId: string }) {
        if (!data?.threadId) return;
        await client.leave(data.threadId);
        client.emit('leftThread', { threadId: data.threadId });
    }

    // Thread requests / approval (admin/mod flows kept in service)
    @SubscribeMessage('requestThread')
    async onRequestThread(@ConnectedSocket() client: Socket, @MessageBody() body: { title: string; description?: string }) {
        const thread = await this.debateService.requestThread(body.title, body.description, client.data.userId);
        this.server.emit('threadRequested', thread);
        return thread;
    }

    @SubscribeMessage('approveThread')
    async onApproveThread(@MessageBody() body: { threadId: string; modForSideA: string; modForSideB: string; adminId: string }) {
        const approved: any = await this.debateService.approveThread(body.threadId, body.adminId, body.modForSideA, body.modForSideB);
        const roomId = (approved && approved._id ? approved._id.toString() : body.threadId);
        this.server.to(roomId).emit('threadApproved', approved);
        return approved;
    }

    // Voting
    @SubscribeMessage('vote')
    async onVote(@ConnectedSocket() client: Socket, @MessageBody() body: { threadId: string; voteType: any }) {
        const saved = await this.debateService.vote({ userId: client.data.userId, threadId: body.threadId, voteType: body.voteType });
        this.server.to(body.threadId).emit('voteUpdated', { threadId: body.threadId, vote: saved });
        return saved;
    }

    // Arguments
    @SubscribeMessage('createArgument')
    async onCreateArgument(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { title: string; content: string; threadId: string; argumentType: any },
    ) {
        const arg = await this.debateService.createArgument({
            title: body.title,
            content: body.content,
            authorId: client.data.userId,
            threadId: body.threadId,
            argumentType: body.argumentType,
        });
        this.server.to(body.threadId).emit('argumentCreated', arg);
        return arg;
    }

    @SubscribeMessage('moderateArgument')
    async onModerateArgument(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { argumentId: string; action: any; reason?: string; notes?: string; threadId: string },
    ) {
        const updated = await this.debateService.moderateArgument({
            argumentId: body.argumentId,
            moderatorId: client.data.userId,
            action: body.action,
            reason: body.reason,
            notes: body.notes,
        });
        if (body.threadId) {
            this.server.to(body.threadId).emit('argumentModerated', updated);
        } else {
            this.server.emit('argumentModerated', updated);
        }
        return updated;
    }
}


