import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'Username của người dùng',
        example: 'john_doe',
        type: String,
    })
    @IsString()
    username: string;

    @ApiProperty({
        description: 'Mật khẩu của người dùng',
        example: 'password123',
        minLength: 6,
        type: String,
    })
    @IsString()
    @MinLength(6)
    password: string;
} 