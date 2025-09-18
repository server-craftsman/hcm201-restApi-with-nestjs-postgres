import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepositoryAbstract } from './user.repository.abstract';
import { User } from '../../domain/entities/user.entity';
import { ICreateUser, IUpdateUser, IUserStatus, UserStatus, UserRole } from '../../domain/interfaces/user.interface';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginatedResponse } from '../../../utils/types/pagination-options';
import { QueryUserDto } from '../../dto/query-user.dto';

@Injectable()
export class UserRepository extends UserRepositoryAbstract {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async create(data: ICreateUser): Promise<User> {
        const hashedPassword = data.password ? await this.hashPassword(data.password) : null;
        const fullName = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.fullName;

        // Convert dateOfBirth string to Date object if provided
        const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;

        const prismaUser = await this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName,
                avatar: data.avatar,
                phone: data.phone,
                dateOfBirth,
                gender: data.gender,
                bio: data.bio,
                location: data.location,
                website: data.website,
                role: data.role || 'USER',
                status: 'OFFLINE',
                isVerified: data.isVerified || false,
                isActive: data.isActive !== undefined ? data.isActive : true,
                lastSeen: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                // OAuth fields
                googleId: data.googleId,
                provider: data.provider || 'local',
            },
        });

        return UserMapper.toDomain(prismaUser);
    }

    async findById(id: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { id },
        });

        return prismaUser ? UserMapper.toDomain(prismaUser) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { email },
        });

        return prismaUser ? UserMapper.toDomain(prismaUser) : null;
    }

    async findByUsername(username: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { username },
        });

        return prismaUser ? UserMapper.toDomain(prismaUser) : null;
    }

    async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrUsername },
                    { username: emailOrUsername },
                ],
            },
        });

        return prismaUser ? UserMapper.toDomain(prismaUser) : null;
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { googleId },
        });

        return prismaUser ? UserMapper.toDomain(prismaUser) : null;
    }

    async findByVerificationHash(hash: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findFirst({
            where: {
                hash: hash,
            },
        });
        return prismaUser ? UserMapper.toDomain(prismaUser) : null;
    }

    async findAll(): Promise<User[]> {
        const prismaUsers = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return UserMapper.toDomainList(prismaUsers);
    }

    async findWithPagination(query: QueryUserDto): Promise<IPaginatedResponse<User>> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (query.email) {
            where.email = { contains: query.email, mode: 'insensitive' };
        }

        if (query.username) {
            where.username = { contains: query.username, mode: 'insensitive' };
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.avatar) {
            where.avatar = { contains: query.avatar, mode: 'insensitive' };
        }

        if (query.onlineOnly) {
            where.status = 'ONLINE';
        }

        if (query.hasAvatar) {
            where.avatar = { not: null };
        }

        if (query.createdAtFrom || query.createdAtTo) {
            where.createdAt = {};
            if (query.createdAtFrom) {
                where.createdAt.gte = query.createdAtFrom;
            }
            if (query.createdAtTo) {
                where.createdAt.lte = query.createdAtTo;
            }
        }

        if (query.lastSeenFrom || query.lastSeenTo) {
            where.lastSeen = {};
            if (query.lastSeenFrom) {
                where.lastSeen.gte = query.lastSeenFrom;
            }
            if (query.lastSeenTo) {
                where.lastSeen.lte = query.lastSeenTo;
            }
        }

        // Build orderBy clause
        const orderBy: any = {};
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';
        orderBy[sortBy] = sortOrder;

        // Get total count
        const total = await this.prisma.user.count({ where });

        // Get paginated data
        const prismaUsers = await this.prisma.user.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        });

        const users = UserMapper.toDomainList(prismaUsers);
        const totalPages = Math.ceil(total / limit);

        return {
            items: users,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    async update(id: string, data: IUpdateUser): Promise<User> {
        const updateData = UserMapper.toUpdatePrisma(data);

        // Convert dateOfBirth string to Date object if provided
        if (data.dateOfBirth) {
            updateData.dateOfBirth = new Date(data.dateOfBirth);
        }

        const prismaUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });

        return UserMapper.toDomain(prismaUser);
    }

    async updateStatus(id: string, status: IUserStatus): Promise<User> {
        const updateData = UserMapper.toStatusUpdatePrisma(status.status);

        const prismaUser = await this.prisma.user.update({
            where: { id },
            data: {
                ...updateData,
                lastSeen: status.lastSeen || new Date(),
            },
        });

        return UserMapper.toDomain(prismaUser);
    }

    async updateRole(id: string, role: UserRole): Promise<User> {
        const prismaUser = await this.prisma.user.update({
            where: { id },
            data: {
                role: role,
                updatedAt: new Date(),
            },
        });

        return UserMapper.toDomain(prismaUser);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }

    async exists(email: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email },
        });

        return count > 0;
    }

    async existsUsername(username: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { username },
        });

        return count > 0;
    }

    async findOnlineUsers(): Promise<User[]> {
        const prismaUsers = await this.prisma.user.findMany({
            where: {
                status: 'ONLINE',
            },
            orderBy: { lastSeen: 'desc' },
        });

        return UserMapper.toDomainList(prismaUsers);
    }

    async findUsersByStatus(status: UserStatus): Promise<User[]> {
        const prismaUsers = await this.prisma.user.findMany({
            where: {
                status: UserMapper.toStatusUpdatePrisma(status).status,
            },
            orderBy: { lastSeen: 'desc' },
        });

        return UserMapper.toDomainList(prismaUsers);
    }

    async updateLastSeen(id: string): Promise<User> {
        const prismaUser = await this.prisma.user.update({
            where: { id },
            data: {
                lastSeen: new Date(),
                updatedAt: new Date(),
            },
        });

        return UserMapper.toDomain(prismaUser);
    }

    async searchUsers(searchTerm: string): Promise<User[]> {
        const prismaUsers = await this.prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                    { username: { contains: searchTerm, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });

        return UserMapper.toDomainList(prismaUsers);
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
            withoutAvatar,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'ONLINE' } }),
            this.prisma.user.count({ where: { status: 'OFFLINE' } }),
            this.prisma.user.count({ where: { status: 'AWAY' } }),
            this.prisma.user.count({ where: { status: 'BUSY' } }),
            this.prisma.user.count({ where: { avatar: { not: null } } }),
            this.prisma.user.count({ where: { avatar: null } }),
        ]);

        return {
            total,
            online,
            offline,
            away,
            busy,
            withAvatar,
            withoutAvatar,
        };
    }

    private async hashPassword(password: string): Promise<string> {
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    protected mapToDomain(data: any): User {
        return UserMapper.toDomain(data);
    }

    protected mapToDomainList(data: any[]): User[] {
        return UserMapper.toDomainList(data);
    }
} 