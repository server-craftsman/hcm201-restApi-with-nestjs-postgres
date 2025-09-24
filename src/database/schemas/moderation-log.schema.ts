import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ModerationLogDocument = ModerationLog & Document;

export enum ModerationAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    FLAG = 'FLAG',
    UNFLAG = 'UNFLAG',
    HIGHLIGHT = 'HIGHLIGHT',
    UNHIGHLIGHT = 'UNHIGHLIGHT',
    DELETE = 'DELETE',
    RESTORE = 'RESTORE',
}

@Schema({ timestamps: true })
export class ModerationLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    moderatorId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Argument', required: true })
    argumentId: Types.ObjectId;

    @Prop({ enum: ModerationAction, required: true })
    action: ModerationAction;

    @Prop()
    reason?: string;

    @Prop()
    notes?: string;

    @Prop({ default: Date.now })
    actionDate: Date;

    @Prop({ type: Object })
    metadata?: Record<string, any>;
}

export const ModerationLogSchema = SchemaFactory.createForClass(ModerationLog);

// Create indexes
ModerationLogSchema.index({ moderatorId: 1, actionDate: -1 });
ModerationLogSchema.index({ argumentId: 1 });
ModerationLogSchema.index({ action: 1, actionDate: -1 });
