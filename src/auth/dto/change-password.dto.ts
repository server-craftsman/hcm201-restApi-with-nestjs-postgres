import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Mật khẩu hiện tại',
        example: 'currentPassword123'
    })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

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
        description: 'Xác nhận mật khẩu mới',
        example: 'newPassword123'
    })
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}
