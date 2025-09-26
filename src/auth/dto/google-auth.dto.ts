import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

    @Transform(({ obj }) => {
        // Custom validation: at least one token must be provided
        if (!obj.idToken && !obj.accessToken) {
            throw new Error('Either idToken or accessToken must be provided');
        }
        return true;
    })
    private readonly _validation = true;
}
