import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FacebookAuthDto {
    @ApiProperty({
        description: 'Facebook access token from client-side authentication',
        example: 'EAABsbCS1iCsBAJ5ZCZCkuOmMAd6I...',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    accessToken: string;
}


