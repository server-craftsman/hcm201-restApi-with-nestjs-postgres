import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../database/schemas/user.schema';

export class ChangeRoleDto {
    @ApiProperty({
        description: 'ID của người dùng cần thay đổi role',
        example: '507f1f77bcf86cd799439011'
    })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({
        description: 'Role mới',
        enum: UserRole,
        example: UserRole.MODERATOR
    })
    @IsEnum(UserRole)
    newRole: UserRole;

    @ApiProperty({
        description: 'Lý do thay đổi role (tùy chọn)',
        example: 'Thăng cấp lên moderator',
        required: false
    })
    @IsString()
    reason?: string;
}
