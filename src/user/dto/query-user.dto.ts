import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../domain/interfaces/user.interface';

export class QueryUserDto {
    @ApiPropertyOptional({
        description: 'Trang hiện tại (bắt đầu từ 1)',
        example: 1,
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số lượng items trên mỗi trang',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo email',
        example: 'user@example.com',
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo username',
        example: 'john_doe',
    })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái người dùng',
        enum: UserStatus,
        example: UserStatus.ONLINE,
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo avatar URL',
        example: 'https://example.com/avatar.jpg',
    })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional({
        description: 'Sắp xếp theo field',
        example: 'createdAt',
        enum: ['id', 'email', 'username', 'status', 'lastSeen', 'createdAt', 'updatedAt'],
    })
    @IsOptional()
    @IsIn(['id', 'email', 'username', 'status', 'lastSeen', 'createdAt', 'updatedAt'])
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Thứ tự sắp xếp',
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc',
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo ngày tạo từ',
        example: '2024-01-01',
        type: Date,
    })
    @IsOptional()
    @Transform(({ value }) => new Date(value))
    createdAtFrom?: Date;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo ngày tạo đến',
        example: '2024-12-31',
        type: Date,
    })
    @IsOptional()
    @Transform(({ value }) => new Date(value))
    createdAtTo?: Date;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo ngày online cuối từ',
        example: '2024-01-01',
        type: Date,
    })
    @IsOptional()
    @Transform(({ value }) => new Date(value))
    lastSeenFrom?: Date;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo ngày online cuối đến',
        example: '2024-12-31',
        type: Date,
    })
    @IsOptional()
    @Transform(({ value }) => new Date(value))
    lastSeenTo?: Date;

    @ApiPropertyOptional({
        description: 'Chỉ lấy người dùng online',
        example: true,
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    onlineOnly?: boolean;

    @ApiPropertyOptional({
        description: 'Chỉ lấy người dùng có avatar',
        example: true,
        type: Boolean,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    hasAvatar?: boolean;
}
