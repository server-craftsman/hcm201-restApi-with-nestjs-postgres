import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DebateThreadDocument = DebateThread & Document;

export enum ThreadStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    CLOSED = 'CLOSED',
    ARCHIVED = 'ARCHIVED',
}

@Schema({ timestamps: true })
export class DebateThread {
    @Prop({ required: true })
    title: string;

    @Prop()
    description?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    moderators: Types.ObjectId[];

    // Assign two moderators explicitly by side
    @Prop({ type: Types.ObjectId, ref: 'User' })
    modForSideA?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    modForSideB?: Types.ObjectId;

    @Prop({ enum: ThreadStatus, default: ThreadStatus.DRAFT })
    status: ThreadStatus;

    @Prop({ default: 0 })
    totalVotes: number;

    @Prop({ default: 0 })
    totalArguments: number;

    @Prop({ default: 0 })
    totalApprovedArguments: number;

    @Prop()
    startDate?: Date;

    @Prop()
    endDate?: Date;

    @Prop({ default: true })
    allowVoting: boolean;

    @Prop({ default: true })
    allowArguments: boolean;

    @Prop({ default: false })
    requireModeration: boolean;

    // Ticketed request flow
    @Prop({ default: false })
    isTicketRequest: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    requestedBy?: Types.ObjectId;
}

export const DebateThreadSchema = SchemaFactory.createForClass(DebateThread);
