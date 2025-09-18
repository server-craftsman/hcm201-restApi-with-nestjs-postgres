import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
    @ApiProperty({
        description: 'Email của người dùng cần gửi lại email xác thực',
        example: 'user@example.com',
        type: String,
    })
    @IsEmail()
    email: string;
} 