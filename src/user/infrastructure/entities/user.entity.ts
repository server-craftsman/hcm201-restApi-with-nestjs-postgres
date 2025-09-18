import { UserStatus } from '@prisma/client';

export class User {
    id: string;
    email: string;
    username: string;
    password: string;
    avatar?: string;
    status: UserStatus;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
} 