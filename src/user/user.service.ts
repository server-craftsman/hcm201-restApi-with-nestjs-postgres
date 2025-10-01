import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '../database/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

export interface CreateUserDto {
    email: string;
    username: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: number;
    dateOfBirth?: Date;
    gender?: string;
    bio?: string;
    location?: string;
    role?: UserRole;
    googleId?: string;
    facebookId?: string;
    provider?: string;
    isVerified?: boolean;
    isActive?: boolean;
}

export interface UpdateUserDto {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: number;
    dateOfBirth?: Date;
    gender?: string;
    bio?: string;
    location?: string;
    role?: UserRole;
    status?: UserStatus;
    isVerified?: boolean;
    isActive?: boolean;
    lastSeen?: Date;
    hash?: string;
    hashExpires?: Date;
    googleId?: string;
    facebookId?: string;
    provider?: string;
    password?: string;
}

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(data: CreateUserDto): Promise<UserDocument> {
        // Validate required fields
        if (!data.email || !data.username) {
            throw new BadRequestException('Email and username are required');
        }

        // Password is required for local users, optional for OAuth users
        if (data.provider === 'local' && !data.password) {
            throw new BadRequestException('Password is required for local users');
        }

        // Check if user already exists by email
        const existingUserByEmail = await this.userModel.findOne({ email: data.email });
        if (existingUserByEmail) {
            throw new ConflictException('User with this email already exists');
        }

        // Check if user already exists by username
        const existingUserByUsername = await this.userModel.findOne({ username: data.username });
        if (existingUserByUsername) {
            throw new ConflictException('Username already taken');
        }

        // Validate username format (alphanumeric and underscore only)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(data.username)) {
            throw new BadRequestException('Username can only contain letters, numbers and underscore');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new BadRequestException('Invalid email format');
        }

        // Validate password strength (only for local users)
        if (data.password && data.password.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters long');
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (data.password) {
            hashedPassword = await bcrypt.hash(data.password, 12);
        }

        // Create new user
        const userData = {
            ...data,
            password: hashedPassword,
            role: data.role || UserRole.USER,
            status: UserStatus.OFFLINE,
            provider: data.provider || 'local',
        };

        const user = new this.userModel(userData);
        return await user.save();
    }

    async findAll(query?: {
        page?: number;
        limit?: number;
        email?: string;
        username?: string;
        status?: UserStatus;
        role?: UserRole;
        createdAtFrom?: Date;
        createdAtTo?: Date;
        lastSeenFrom?: Date;
        lastSeenTo?: Date;
        onlineOnly?: boolean;
        hasAvatar?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ items: UserDocument[]; totalItems: number; page: number; limit: number }> {
        const page = Math.max(1, Number(query?.page ?? 1));
        const limit = Math.max(1, Math.min(Number(query?.limit ?? 10), 100));
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query?.email) filter.email = new RegExp(query.email, 'i');
        if (query?.username) filter.username = new RegExp(query.username, 'i');
        if (query?.status) filter.status = query.status;
        if (query?.role) filter.role = query.role;
        if (query?.onlineOnly) filter.status = UserStatus.ONLINE;
        if (query?.hasAvatar) filter.avatar = { $exists: true, $ne: null };

        if (query?.createdAtFrom || query?.createdAtTo) {
            filter.createdAt = {};
            if (query.createdAtFrom) filter.createdAt.$gte = query.createdAtFrom;
            if (query.createdAtTo) filter.createdAt.$lte = query.createdAtTo;
        }

        if (query?.lastSeenFrom || query?.lastSeenTo) {
            filter.lastSeen = {};
            if (query.lastSeenFrom) filter.lastSeen.$gte = query.lastSeenFrom;
            if (query.lastSeenTo) filter.lastSeen.$lte = query.lastSeenTo;
        }

        const sortBy = query?.sortBy ?? 'createdAt';
        const sortOrder = (query?.sortOrder ?? 'desc') === 'asc' ? 1 : -1;

        const [items, totalItems] = await Promise.all([
            this.userModel
                .find(filter)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(filter),
        ]);

        return { items, totalItems, page, limit };
    }

    async findById(id: string): Promise<UserDocument | null> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }
        return await this.userModel.findById(id).exec();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        if (!email) {
            throw new BadRequestException('Email is required');
        }
        return await this.userModel.findOne({ email }).exec();
    }

    async findByUsername(username: string): Promise<UserDocument | null> {
        if (!username) {
            throw new BadRequestException('Username is required');
        }
        return await this.userModel.findOne({ username }).exec();
    }

    async findByEmailOrUsername(emailOrUsername: string): Promise<UserDocument | null> {
        if (!emailOrUsername) {
            throw new BadRequestException('Email or username is required');
        }
        return await this.userModel.findOne({
            $or: [
                { email: emailOrUsername },
                { username: emailOrUsername }
            ]
        }).exec();
    }

    async findByGoogleId(googleId: string): Promise<UserDocument | null> {
        if (!googleId) {
            throw new BadRequestException('Google ID is required');
        }
        return await this.userModel.findOne({ googleId }).exec();
    }

    async findByFacebookId(facebookId: string): Promise<UserDocument | null> {
        if (!facebookId) {
            throw new BadRequestException('Facebook ID is required');
        }
        return await this.userModel.findOne({ facebookId }).exec();
    }

    async update(id: string, data: UpdateUserDto): Promise<UserDocument> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        // Check if user exists
        const existingUser = await this.userModel.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        // Validate email format if provided
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw new BadRequestException('Invalid email format');
            }
        }

        // Validate username format if provided
        if (data.username) {
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(data.username)) {
                throw new BadRequestException('Username can only contain letters, numbers and underscore');
            }
        }

        // Check if email is being updated and if it's already taken
        if (data.email && data.email !== existingUser.email) {
            const userWithEmail = await this.userModel.findOne({ email: data.email });
            if (userWithEmail) {
                throw new ConflictException('Email already taken');
            }
        }

        // Check if username is being updated and if it's already taken
        if (data.username && data.username !== existingUser.username) {
            const userWithUsername = await this.userModel.findOne({ username: data.username });
            if (userWithUsername) {
                throw new ConflictException('Username already taken');
            }
        }

        // Update user
        const updatedUser = await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }
        return updatedUser;
    }

    async delete(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const existingUser = await this.userModel.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        await this.userModel.findByIdAndDelete(id).exec();
    }

    async validateUser(emailOrUsername: string, password: string): Promise<UserDocument | null> {
        if (!emailOrUsername || !password) {
            return null;
        }

        const user = await this.findByEmailOrUsername(emailOrUsername);
        if (!user) {
            return null;
        }

        // Check if user is active
        if (!user.isActive) {
            return null;
        }

        // Check if user has a password (OAuth users might not have one)
        if (!user.password) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async updateLastSeen(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        await this.userModel.findByIdAndUpdate(id, {
            lastSeen: new Date()
        }).exec();
    }

    async updateStatus(id: string, status: UserStatus): Promise<UserDocument> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const existingUser = await this.userModel.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(id, {
            status,
            lastSeen: new Date()
        }, { new: true }).exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        return updatedUser;
    }

    async updateRole(id: string, role: UserRole): Promise<UserDocument> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        if (!role) {
            throw new BadRequestException('Role is required');
        }

        const existingUser = await this.userModel.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }
        return updatedUser;
    }

    async findOnlineUsers(): Promise<UserDocument[]> {
        return await this.userModel.find({ status: UserStatus.ONLINE }).exec();
    }

    async findUsersByStatus(status: UserStatus): Promise<UserDocument[]> {
        if (!status) {
            throw new BadRequestException('Status is required');
        }
        return await this.userModel.find({ status }).exec();
    }

    async searchUsers(searchTerm: string): Promise<UserDocument[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            throw new BadRequestException('Search term is required');
        }

        const regex = new RegExp(searchTerm.trim(), 'i');
        return await this.userModel.find({
            $or: [
                { username: regex },
                { email: regex },
                { firstName: regex },
                { lastName: regex },
                { fullName: regex }
            ]
        }).exec();
    }

    async getUsersStats(): Promise<{
        total: number;
        online: number;
        offline: number;
        away: number;
        busy: number;
        withAvatar: number;
        withoutAvatar: number;
    }> {
        const [
            total,
            online,
            offline,
            away,
            busy,
            withAvatar,
            withoutAvatar
        ] = await Promise.all([
            this.userModel.countDocuments(),
            this.userModel.countDocuments({ status: UserStatus.ONLINE }),
            this.userModel.countDocuments({ status: UserStatus.OFFLINE }),
            this.userModel.countDocuments({ status: UserStatus.AWAY }),
            this.userModel.countDocuments({ status: UserStatus.BUSY }),
            this.userModel.countDocuments({ avatar: { $exists: true, $ne: null } }),
            this.userModel.countDocuments({ $or: [{ avatar: { $exists: false } }, { avatar: null }] })
        ]);

        return {
            total,
            online,
            offline,
            away,
            busy,
            withAvatar,
            withoutAvatar
        };
    }

    async findByVerificationHash(hash: string): Promise<UserDocument | null> {
        if (!hash) {
            throw new BadRequestException('Verification hash is required');
        }
        return await this.userModel.findOne({ hash }).exec();
    }
}