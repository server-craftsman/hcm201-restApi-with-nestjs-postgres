import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AdminChangePasswordDto {
    @ApiProperty({
        description: 'ID của người dùng cần thay đổi mật khẩu',
        example: '507f1f77bcf86cd799439011'
    })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({
        description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
        example: 'newPassword123',
        minLength: 6
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    newPassword: string;

    @ApiProperty({
        description: 'Lý do thay đổi mật khẩu (tùy chọn)',
        example: 'Reset mật khẩu theo yêu cầu người dùng',
        required: false
    })
    @IsString()
    reason?: string;
}
