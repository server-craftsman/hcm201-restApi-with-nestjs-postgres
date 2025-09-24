import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApproveThreadDto {
    @ApiProperty({ description: 'Moderator cho phe A', example: 'modAId' })
    @IsString()
    modForSideA: string;

    @ApiProperty({ description: 'Moderator cho phe B', example: 'modBId' })
    @IsString()
    modForSideB: string;
}


