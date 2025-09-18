import { User as PrismaUser, UserStatus as PrismaUserStatus } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { IUser, ICreateUser, IUpdateUser, UserStatus, UserRole } from '../../domain/interfaces/user.interface';

export class UserMapper {
    static toDomain(prismaUser: PrismaUser): User {
        return new User({
            id: prismaUser.id,
            email: prismaUser.email,
            username: prismaUser.username,
            password: prismaUser.password || undefined,
            firstName: prismaUser.firstName || undefined,
            lastName: prismaUser.lastName || undefined,
            fullName: prismaUser.fullName || undefined,
            avatar: prismaUser.avatar || undefined,
            phone: prismaUser.phone || undefined,
            dateOfBirth: prismaUser.dateOfBirth || undefined,
            gender: prismaUser.gender || undefined,
            bio: prismaUser.bio || undefined,
            location: prismaUser.location || undefined,
            website: prismaUser.website || undefined,
            role: prismaUser.role as UserRole,
            status: this.mapPrismaStatusToDomain(prismaUser.status),
            isVerified: prismaUser.isVerified,
            isActive: prismaUser.isActive,
            hash: prismaUser.hash || undefined,
            hashExpires: prismaUser.hashExpires || undefined,
            lastSeen: prismaUser.lastSeen || new Date(),
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
            // OAuth fields
            googleId: prismaUser.googleId || undefined,
            provider: prismaUser.provider || undefined,
        });
    }

    static toDomainList(prismaUsers: PrismaUser[]): User[] {
        return prismaUsers.map(user => this.toDomain(user));
    }

    static toPrisma(user: User | ICreateUser): Partial<PrismaUser> {
        if ('id' in user && user.id) {
            // Existing user
            return {
                id: user.id,
                email: user.email,
                username: user.username,
                password: user.password,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                avatar: user.avatar,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bio: user.bio,
                location: user.location,
                website: user.website,
                role: user.role,
                status: this.mapDomainStatusToPrisma(user.status),
                lastSeen: user.lastSeen,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                isVerified: user.isVerified,
                isActive: user.isActive,
                // OAuth fields
                googleId: user.googleId,
                provider: user.provider,
            };
        } else {
            // New user
            return {
                email: user.email,
                username: user.username,
                password: user.password,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined),
                avatar: user.avatar,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bio: user.bio,
                location: user.location,
                website: user.website,
                role: user.role || 'USER',
                status: PrismaUserStatus.OFFLINE,
                lastSeen: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                isVerified: user.isVerified || false,
                isActive: user.isActive !== undefined ? user.isActive : true,
                // OAuth fields
                googleId: user.googleId,
                provider: user.provider || 'local',
            };
        }
    }

    static toUpdatePrisma(data: IUpdateUser): Partial<PrismaUser> {
        const updateData: Partial<PrismaUser> = {
            updatedAt: new Date(),
        };

        if (data.email !== undefined) updateData.email = data.email;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.fullName !== undefined) updateData.fullName = data.fullName;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
        if (data.gender !== undefined) updateData.gender = data.gender;
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.website !== undefined) updateData.website = data.website;
        if (data.avatar !== undefined) updateData.avatar = data.avatar;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.lastSeen !== undefined) updateData.lastSeen = data.lastSeen;
        if (data.hash !== undefined) updateData.hash = data.hash;
        if (data.hashExpires !== undefined) updateData.hashExpires = data.hashExpires;
        // OAuth fields
        if (data.googleId !== undefined) updateData.googleId = data.googleId;
        if (data.provider !== undefined) updateData.provider = data.provider;

        return updateData;
    }

    static toStatusUpdatePrisma(status: UserStatus): Partial<PrismaUser> {
        return {
            status: this.mapDomainStatusToPrisma(status),
            lastSeen: new Date(),
            updatedAt: new Date(),
        };
    }

    private static mapPrismaStatusToDomain(status: PrismaUserStatus): UserStatus {
        switch (status) {
            case PrismaUserStatus.ONLINE:
                return UserStatus.ONLINE;
            case PrismaUserStatus.OFFLINE:
                return UserStatus.OFFLINE;
            case PrismaUserStatus.AWAY:
                return UserStatus.AWAY;
            case PrismaUserStatus.BUSY:
                return UserStatus.BUSY;
            default:
                return UserStatus.OFFLINE;
        }
    }

    private static mapDomainStatusToPrisma(status: UserStatus): PrismaUserStatus {
        switch (status) {
            case UserStatus.ONLINE:
                return PrismaUserStatus.ONLINE;
            case UserStatus.OFFLINE:
                return PrismaUserStatus.OFFLINE;
            case UserStatus.AWAY:
                return PrismaUserStatus.AWAY;
            case UserStatus.BUSY:
                return PrismaUserStatus.BUSY;
            default:
                return PrismaUserStatus.OFFLINE;
        }
    }

    static toResponse(user: User): Omit<IUser, 'password'> {
        const { password, ...userResponse } = user.toJSON();
        return userResponse;
    }

    static toResponseList(users: User[]): Omit<IUser, 'password'>[] {
        return users.map(user => this.toResponse(user));
    }
} 