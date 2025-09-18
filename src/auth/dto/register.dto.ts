import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'Email của người dùng',
        example: 'john.doe@example.com',
        type: String,
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Username của người dùng',
        example: 'john_doe',
        type: String,
    })
    @IsString()
    @MinLength(3)
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

    @ApiProperty({
        description: 'Tên của người dùng',
        example: 'John',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({
        description: 'Họ của người dùng',
        example: 'Doe',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    lastName?: string;
}
