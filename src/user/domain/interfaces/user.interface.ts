import { User } from '../entities/user.entity';

export interface IUser {
    id: string;
    email: string;
    username: string;
    password?: string; // Nullable for OAuth users
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: number;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    location?: string;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    isActive: boolean;
    hash?: string;
    hashExpires?: Date;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt: Date;
    // OAuth fields
    googleId?: string;
    facebookId?: string;
    provider?: string;
}

export interface ICreateUser {
    email: string;
    username: string;
    password?: string; // Optional for OAuth users
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: number;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    location?: string;
    role?: UserRole;
    isVerified?: boolean;
    isActive?: boolean;
    // OAuth fields
    googleId?: string;
    facebookId?: string;
    provider?: string;
}

export interface IUpdateUser {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: number;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    location?: string;
    role?: UserRole;
    isVerified?: boolean;
    isActive?: boolean;
    hash?: string;
    hashExpires?: Date;
    lastSeen?: Date;
    // OAuth fields
    googleId?: string;
    facebookId?: string;
    provider?: string;
}

export interface IUserStatus {
    id: string;
    status: UserStatus;
    lastSeen?: Date;
}

export enum UserStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY',
    BUSY = 'BUSY',
}

export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUserRepository {
    create(data: ICreateUser): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    findByFacebookId(facebookId: string): Promise<User | null>;
    findByVerificationHash(hash: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    update(id: string, data: IUpdateUser): Promise<User>;
    updateStatus(id: string, status: IUserStatus): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    delete(id: string): Promise<void>;
    exists(email: string): Promise<boolean>;
    existsUsername(username: string): Promise<boolean>;
} 