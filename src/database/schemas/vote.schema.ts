import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoteDocument = Vote & Document;

export enum VoteType {
    SUPPORT = 'SUPPORT',
    OPPOSE = 'OPPOSE',
}

@Schema({ timestamps: true })
export class Vote {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'DebateThread', required: true })
    threadId: Types.ObjectId;

    @Prop({ enum: VoteType, required: true })
    voteType: VoteType;

    @Prop({ default: Date.now })
    votedAt: Date;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

// Create compound index to ensure one vote per user per thread
VoteSchema.index({ userId: 1, threadId: 1 }, { unique: true });
