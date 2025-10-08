import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIModerationDocument = AIModeration & Document;

export enum ModerationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    FLAGGED = 'FLAGGED',
    MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum ModerationCategory {
    EDUCATIONAL = 'EDUCATIONAL',
    ACCURATE = 'ACCURATE',
    CONSTRUCTIVE = 'CONSTRUCTIVE',
    TOXIC = 'TOXIC',
    POLITICAL_BIAS = 'POLITICAL_BIAS',
    ANTI_GOVERNMENT = 'ANTI_GOVERNMENT',
    HISTORICAL_DISTORTION = 'HISTORICAL_DISTORTION',
    INAPPROPRIATE = 'INAPPROPRIATE',
    MANUAL_REVIEW = 'MANUAL_REVIEW',
    SPAM = 'SPAM',
    OFF_TOPIC = 'OFF_TOPIC'
}

@Schema({ timestamps: true })
export class AIModeration {
    @Prop({ type: Types.ObjectId, ref: 'Argument', required: false })
    argumentId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: false })
    reviewedBy?: Types.ObjectId; // Manual reviewer

    @Prop({ required: true, enum: ModerationStatus })
    status: ModerationStatus;

    @Prop({ required: true, enum: RiskLevel })
    riskLevel: RiskLevel;

    @Prop({ required: true, min: 0, max: 1 })
    confidence: number;

    @Prop({ type: [String], enum: ModerationCategory, default: [] })
    categories: ModerationCategory[];

    @Prop({ type: [String], default: [] })
    reasons: string[];

    @Prop({ type: [String], default: [] })
    suggestions: string[];

    @Prop({ required: true, type: Object })
    aiAnalysis: {
        isApproved: boolean;
        confidence: number;
        reasons: string[];
        riskLevel: RiskLevel;
        categories: ModerationCategory[];
        suggestions?: string[];
    };

    @Prop({ required: false, type: Object })
    contentAnalysis?: {
        sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        toxicity: number;
        politicalBias: number;
        hoChiMinhRelevance: number;
        educationalValue: number;
    };

    @Prop({ type: String, required: false })
    manualReviewNotes?: string;

    @Prop({ type: Date, required: false })
    reviewedAt?: Date;

    @Prop({ type: Date, required: false })
    expiresAt?: Date; // For auto-approval after certain time

    @Prop({ type: Boolean, default: false })
    isAutoApproved: boolean;

    @Prop({ type: Boolean, default: false })
    requiresHumanReview: boolean;

    @Prop({ type: Number, default: 0 })
    reviewCount: number; // How many times this has been reviewed

    @Prop({ type: [String], default: [] })
    aiModels: string[]; // Which AI models were used

    @Prop({ type: Object, required: false })
    metadata?: {
        processingTime?: number;
        apiCalls?: number;
        cost?: number;
        version?: string;
        humanOverride?: boolean;
        overrideReason?: string;
    };
}

export const AIModerationSchema = SchemaFactory.createForClass(AIModeration);

// Indexes for better performance
AIModerationSchema.index({ argumentId: 1 });
AIModerationSchema.index({ status: 1 });
AIModerationSchema.index({ riskLevel: 1 });
AIModerationSchema.index({ createdAt: -1 });
AIModerationSchema.index({ requiresHumanReview: 1 });
AIModerationSchema.index({ expiresAt: 1 });
