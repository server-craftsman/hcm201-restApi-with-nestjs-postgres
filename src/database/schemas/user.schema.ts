import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY',
    BUSY = 'BUSY',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop()
    password?: string;

    @Prop()
    firstName?: string;

    @Prop()
    lastName?: string;

    @Prop()
    fullName?: string;

    @Prop()
    avatar?: string;

    @Prop()
    phone?: number;

    @Prop()
    dateOfBirth?: Date;

    @Prop({ enum: Gender })
    gender?: Gender;

    @Prop()
    bio?: string;

    @Prop()
    location?: string;

    @Prop()
    website?: string;

    @Prop({ enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop({ enum: UserStatus, default: UserStatus.OFFLINE })
    status: UserStatus;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    hash?: string;

    @Prop()
    hashExpires?: Date;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastSeen?: Date;

    // OAuth fields
    @Prop()
    googleId?: string;

    @Prop()
    facebookId?: string;

    @Prop({ default: 'local' })
    provider: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
