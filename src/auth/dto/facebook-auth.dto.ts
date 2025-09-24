import { ApiProperty } from '@nestjs/swagger';

export class FacebookAuthDto {
    @ApiProperty({ description: 'Facebook access token', example: 'EAABsbCS1...' })
    accessToken: string;
}


