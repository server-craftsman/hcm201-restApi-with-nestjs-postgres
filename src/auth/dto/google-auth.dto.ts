import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
    @ApiProperty({
        description: 'Google OAuth access token',
        example: 'ya29.a0AfH6SMC...',
        type: String,
    })
    @IsString()
    accessToken: string;

    @ApiProperty({
        description: 'Google OAuth ID token',
        example: 'eyJhbGciOiJSUzI1NiIs...',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    idToken?: string;
}
