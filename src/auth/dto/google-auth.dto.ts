import { IsString, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
    @ApiProperty({
        description: 'Google OAuth ID token from client-side authentication (recommended)',
        example: 'eyJhbGciOiJSUzI1NiIs...',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    idToken?: string;

    @ApiProperty({
        description: 'Google OAuth access token (alternative to idToken)',
        example: 'ya29.a0AfH6SMC...',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    accessToken?: string;

    // Custom validation to ensure at least one token is provided
    @ValidateIf(o => !o.idToken && !o.accessToken)
    @IsString({ message: 'Either idToken or accessToken must be provided' })
    _requireAtLeastOneToken?: never;
}
