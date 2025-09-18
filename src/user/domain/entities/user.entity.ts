import { IUser, ICreateUser, IUpdateUser, UserStatus, UserRole } from '../interfaces/user.interface';

export class User implements IUser {
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
    website?: string;
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
    provider?: string;

    constructor(data: IUser) {
        this.id = data.id;
        this.email = data.email;
        this.username = data.username;
        this.password = data.password;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.fullName = data.fullName;
        this.avatar = data.avatar;
        this.phone = data.phone;
        this.dateOfBirth = data.dateOfBirth;
        this.gender = data.gender;
        this.bio = data.bio;
        this.location = data.location;
        this.website = data.website;
        this.role = data.role;
        this.status = data.status;
        this.isVerified = data.isVerified;
        this.isActive = data.isActive;
        this.hash = data.hash;
        this.hashExpires = data.hashExpires;
        this.lastSeen = data.lastSeen;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        // OAuth fields
        this.googleId = data.googleId;
        this.provider = data.provider;
    }

    static create(data: ICreateUser): User {
        const fullName = data.fullName || (data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : undefined);

        return new User({
            id: '',
            email: data.email,
            username: data.username,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            fullName,
            avatar: data.avatar,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            bio: data.bio,
            location: data.location,
            website: data.website,
            role: data.role || UserRole.USER,
            status: UserStatus.OFFLINE,
            isVerified: data.isVerified || false,
            isActive: data.isActive !== undefined ? data.isActive : true,
            lastSeen: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            // OAuth fields
            googleId: data.googleId,
            provider: data.provider || 'local',
        });
    }

    update(data: IUpdateUser): void {
        if (data.email) this.email = data.email;
        if (data.username) this.username = data.username;
        if (data.firstName) this.firstName = data.firstName;
        if (data.lastName) this.lastName = data.lastName;
        if (data.fullName) this.fullName = data.fullName;
        if (data.phone) this.phone = data.phone;
        if (data.dateOfBirth) this.dateOfBirth = data.dateOfBirth;
        if (data.gender) this.gender = data.gender;
        if (data.bio) this.bio = data.bio;
        if (data.location) this.location = data.location;
        if (data.website) this.website = data.website;
        if (data.avatar !== undefined) this.avatar = data.avatar;
        if (data.role) this.role = data.role;
        if (data.isVerified !== undefined) this.isVerified = data.isVerified;
        if (data.isActive !== undefined) this.isActive = data.isActive;
        if (data.lastSeen) this.lastSeen = data.lastSeen;
        // OAuth fields
        if (data.googleId) this.googleId = data.googleId;
        if (data.provider) this.provider = data.provider;

        // Update fullName if firstName or lastName changed
        if (data.firstName || data.lastName) {
            const firstName = data.firstName || this.firstName;
            const lastName = data.lastName || this.lastName;
            this.fullName = firstName && lastName ? `${firstName} ${lastName}` : undefined;
        }

        this.updatedAt = new Date();
    }

    setStatus(status: UserStatus): void {
        this.status = status;
        this.lastSeen = new Date();
        this.updatedAt = new Date();
    }

    setRole(role: UserRole): void {
        this.role = role;
        this.updatedAt = new Date();
    }

    verify(): void {
        this.isVerified = true;
        this.updatedAt = new Date();
    }

    activate(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    deactivate(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    isOnline(): boolean {
        return this.status === UserStatus.ONLINE;
    }

    isOffline(): boolean {
        return this.status === UserStatus.OFFLINE;
    }

    isAway(): boolean {
        return this.status === UserStatus.AWAY;
    }

    isBusy(): boolean {
        return this.status === UserStatus.BUSY;
    }

    isAdmin(): boolean {
        return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
    }

    isModerator(): boolean {
        return this.role === UserRole.MODERATOR || this.isAdmin();
    }

    isSuperAdmin(): boolean {
        return this.role === UserRole.SUPER_ADMIN;
    }

    hasPermission(requiredRole: UserRole): boolean {
        const roleHierarchy = {
            [UserRole.USER]: 1,
            [UserRole.MODERATOR]: 2,
            [UserRole.ADMIN]: 3,
            [UserRole.SUPER_ADMIN]: 4,
        };

        return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
    }

    setVerificationHash(hash: string, expiresInHours: number = 24): void {
        this.hash = hash;
        this.hashExpires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    clearVerificationHash(): void {
        this.hash = undefined;
        this.hashExpires = undefined;
    }

    isVerificationHashExpired(): boolean {
        if (!this.hashExpires) {
            return true;
        }
        return this.hashExpires < new Date();
    }

    updateLastSeen(): void {
        this.lastSeen = new Date();
    }

    toJSON(): IUser {
        return {
            id: this.id,
            email: this.email,
            username: this.username,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
            fullName: this.fullName,
            avatar: this.avatar,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            gender: this.gender,
            bio: this.bio,
            location: this.location,
            website: this.website,
            role: this.role,
            status: this.status,
            isVerified: this.isVerified,
            isActive: this.isActive,
            lastSeen: this.lastSeen,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            // OAuth fields
            googleId: this.googleId,
            provider: this.provider,
        };
    }
} 