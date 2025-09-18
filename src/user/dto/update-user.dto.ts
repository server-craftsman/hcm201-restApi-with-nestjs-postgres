import { IsOptional, IsString, IsEmail, IsEnum, IsDateString, IsUrl, IsNumber, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../domain/interfaces/user.interface';

export class UpdateUserDto {
    @ApiPropertyOptional({
        description: 'Email address mới của người dùng',
        example: 'newemail@example.com',
        type: String,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        description: 'Tên người dùng mới (tối thiểu 3 ký tự)',
        example: 'new_username',
        minLength: 3,
        type: String,
    })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({
        description: 'Tên đầu',
        example: 'John',
        type: String,
    })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({
        description: 'Tên cuối',
        example: 'Doe',
        type: String,
    })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại',
        example: 84123456789,
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    phone?: number;

    @ApiPropertyOptional({
        description: 'Ngày sinh',
        example: '1990-01-01',
        type: Date,
    })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: Date;

    @ApiPropertyOptional({
        description: 'Giới tính',
        example: 'MALE',
        enum: ['MALE', 'FEMALE', 'OTHER'],
    })
    @IsOptional()
    @IsEnum(['MALE', 'FEMALE', 'OTHER'])
    gender?: 'MALE' | 'FEMALE' | 'OTHER';

    @ApiPropertyOptional({
        description: 'Tiểu sử ngắn',
        example: 'Tôi là một developer yêu thích công nghệ',
        type: String,
    })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({
        description: 'Địa chỉ',
        example: 'Hà Nội, Việt Nam',
        type: String,
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Website cá nhân',
        example: 'https://example.com',
        type: String,
    })
    @IsOptional()
    @IsUrl()
    website?: string;

    @ApiPropertyOptional({
        description: 'URL avatar mới của người dùng',
        example: 'https://example.com/new-avatar.jpg',
        type: String,
    })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional({
        description: 'Vai trò người dùng',
        example: UserRole.USER,
        enum: UserRole,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
} 