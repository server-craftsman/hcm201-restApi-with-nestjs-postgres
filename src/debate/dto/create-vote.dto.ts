import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { VoteType } from '../../database/schemas/vote.schema';

export class CreateVoteDto {
    @ApiProperty({ description: 'ID chủ đề tranh luận', example: 'threadId123' })
    @IsString()
    threadId: string;

    @ApiProperty({ description: 'Loại phiếu', enum: VoteType, example: VoteType.SUPPORT })
    @IsEnum(VoteType)
    voteType: VoteType;
}


