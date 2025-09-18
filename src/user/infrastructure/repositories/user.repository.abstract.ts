import { IUserRepository, ICreateUser, IUpdateUser, IUserStatus, UserRole } from '../../domain/interfaces/user.interface';
import { User } from '../../domain/entities/user.entity';

export abstract class UserRepositoryAbstract implements IUserRepository {
    abstract create(data: ICreateUser): Promise<User>;
    abstract findById(id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract findByUsername(username: string): Promise<User | null>;
    abstract findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
    abstract findByGoogleId(googleId: string): Promise<User | null>;
    abstract findAll(): Promise<User[]>;
    abstract findByVerificationHash(hash: string): Promise<User | null>;
    abstract update(id: string, data: IUpdateUser): Promise<User>;
    abstract updateStatus(id: string, status: IUserStatus): Promise<User>;
    abstract updateRole(id: string, role: UserRole): Promise<User>;
    abstract delete(id: string): Promise<void>;
    abstract exists(email: string): Promise<boolean>;
    abstract existsUsername(username: string): Promise<boolean>;

    protected abstract mapToDomain(data: any): User;
    protected abstract mapToDomainList(data: any[]): User[];
} 