import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ArgumentDocument = Argument & Document;

export enum ArgumentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    FLAGGED = 'FLAGGED',
}

export enum ArgumentType {
    SUPPORT = 'SUPPORT',
    OPPOSE = 'OPPOSE',
    NEUTRAL = 'NEUTRAL',
}

@Schema({ timestamps: true })
export class Argument {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    authorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'DebateThread', required: true })
    threadId: Types.ObjectId;

    @Prop({ enum: ArgumentType, required: true })
    argumentType: ArgumentType;

    @Prop({ enum: ArgumentStatus, default: ArgumentStatus.PENDING })
    status: ArgumentStatus;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    moderatedBy?: Types.ObjectId;

    @Prop()
    moderationNotes?: string;

    @Prop()
    moderatedAt?: Date;

    @Prop({ default: 0 })
    upvotes: number;

    @Prop({ default: 0 })
    downvotes: number;

    @Prop({ default: 0 })
    score: number;

    @Prop({ default: 0 })
    viewCount: number;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    upvotedBy: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    downvotedBy: Types.ObjectId[];

    @Prop({ default: false })
    isHighlighted: boolean;

    @Prop()
    rejectionReason?: string;
}

export const ArgumentSchema = SchemaFactory.createForClass(Argument);

// Create indexes for better performance
ArgumentSchema.index({ threadId: 1, status: 1 });
ArgumentSchema.index({ authorId: 1 });
ArgumentSchema.index({ status: 1, createdAt: -1 });
