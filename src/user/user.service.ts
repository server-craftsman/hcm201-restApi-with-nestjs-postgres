import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { User } from './domain/entities/user.entity';
import { ICreateUser, IUpdateUser, IUserStatus, UserStatus, IUser, UserRole } from './domain/interfaces/user.interface';
import { UserMapper } from './infrastructure/mappers/user.mapper';
import { IPaginatedResponse } from '../utils/types/pagination-options';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) { }

    async createUser(data: ICreateUser): Promise<Omit<IUser, 'password'>> {
        // Validate required fields
        if (!data.email || !data.username) {
            throw new BadRequestException('Email and username are required');
        }

        // Password is required for local users, optional for OAuth users
        if (data.provider === 'local' && !data.password) {
            throw new BadRequestException('Password is required for local users');
        }

        // Check if user already exists by email
        const existingUserByEmail = await this.userRepository.findByEmail(data.email);
        if (existingUserByEmail) {
            throw new ConflictException('User with this email already exists');
        }

        // Check if user already exists by username
        const existingUserByUsername = await this.userRepository.findByUsername(data.username);
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

        // Create new user
        const user = await this.userRepository.create(data);
        return UserMapper.toResponse(user);
    }

    async findAllUsers(): Promise<Omit<IUser, 'password'>[]> {
        const users = await this.userRepository.findAll();
        return UserMapper.toResponseList(users);
    }

    async findUsersWithPagination(query: QueryUserDto): Promise<IPaginatedResponse<Omit<IUser, 'password'>>> {
        const result = await this.userRepository.findWithPagination(query);

        return {
            items: UserMapper.toResponseList(result.items),
            pagination: result.pagination,
        };
    }

    async findUserById(id: string): Promise<Omit<IUser, 'password'>> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return UserMapper.toResponse(user);
    }

    // Returns domain User entity (not DTO) for internal use cases
    async getUserEntityById(id: string): Promise<User> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        if (!email) {
            throw new BadRequestException('Email is required');
        }
        return await this.userRepository.findByEmail(email);
    }

    async findUserByUsername(username: string): Promise<User | null> {
        if (!username) {
            throw new BadRequestException('Username is required');
        }
        return await this.userRepository.findByUsername(username);
    }

    async findUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
        if (!emailOrUsername) {
            throw new BadRequestException('Email or username is required');
        }
        return await this.userRepository.findByEmailOrUsername(emailOrUsername);
    }

    async findUserByGoogleId(googleId: string): Promise<User | null> {
        if (!googleId) {
            throw new BadRequestException('Google ID is required');
        }
        return await this.userRepository.findByGoogleId(googleId);
    }

    async findUserByVerificationHash(hash: string): Promise<User | null> {
        if (!hash) {
            throw new BadRequestException('Verification hash is required');
        }
        return await this.userRepository.findByVerificationHash(hash);
    }

    async updateUser(id: string, data: IUpdateUser): Promise<Omit<IUser, 'password'>> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        // Check if user exists
        const existingUser = await this.userRepository.findById(id);
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
            const userWithEmail = await this.userRepository.findByEmail(data.email);
            if (userWithEmail) {
                throw new ConflictException('Email already taken');
            }
        }

        // Check if username is being updated and if it's already taken
        if (data.username && data.username !== existingUser.username) {
            const userWithUsername = await this.userRepository.findByUsername(data.username);
            if (userWithUsername) {
                throw new ConflictException('Username already taken');
            }
        }

        // Update user
        const updatedUser = await this.userRepository.update(id, data);
        return UserMapper.toResponse(updatedUser);
    }

    async updateUserStatus(id: string, status: IUserStatus): Promise<Omit<IUser, 'password'>> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.userRepository.updateStatus(id, status);
        return UserMapper.toResponse(updatedUser);
    }

    async updateUserRole(id: string, role: UserRole): Promise<Omit<IUser, 'password'>> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        if (!role) {
            throw new BadRequestException('Role is required');
        }

        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.userRepository.updateRole(id, role);
        return UserMapper.toResponse(updatedUser);
    }

    async deleteUser(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.delete(id);
    }

    async findOnlineUsers(): Promise<Omit<IUser, 'password'>[]> {
        const users = await this.userRepository.findOnlineUsers();
        return UserMapper.toResponseList(users);
    }

    async findUsersByStatus(status: UserStatus): Promise<Omit<IUser, 'password'>[]> {
        if (!status) {
            throw new BadRequestException('Status is required');
        }

        const users = await this.userRepository.findUsersByStatus(status);
        return UserMapper.toResponseList(users);
    }

    async searchUsers(searchTerm: string): Promise<Omit<IUser, 'password'>[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            throw new BadRequestException('Search term is required');
        }

        const users = await this.userRepository.searchUsers(searchTerm.trim());
        return UserMapper.toResponseList(users);
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
        return await this.userRepository.getUsersStats();
    }

    async updateLastSeen(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.updateLastSeen(id);
    }

    async validateUser(emailOrUsername: string, password: string): Promise<User | null> {
        if (!emailOrUsername || !password) {
            return null;
        }

        const user = await this.userRepository.findByEmailOrUsername(emailOrUsername);
        if (!user) {
            return null;
        }

        // Check if user is active
        if (!user.isActive) {
            return null;
        }

        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async setUserOnline(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        await this.updateUserStatus(id, {
            id,
            status: UserStatus.ONLINE,
            lastSeen: new Date(),
        });
    }

    async setUserOffline(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        await this.updateUserStatus(id, {
            id,
            status: UserStatus.OFFLINE,
            lastSeen: new Date(),
        });
    }

    async setUserAway(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        await this.updateUserStatus(id, {
            id,
            status: UserStatus.AWAY,
            lastSeen: new Date(),
        });
    }

    async setUserBusy(id: string): Promise<void> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        await this.updateUserStatus(id, {
            id,
            status: UserStatus.BUSY,
            lastSeen: new Date(),
        });
    }
} 