import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { VoteType } from '@prisma/client';

export class CreateVoteDto {
    @ApiProperty({
        description: 'ID của luận điểm cần vote',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    argumentId: string;

    @ApiProperty({
        description: 'Loại vote (UPVOTE hoặc DOWNVOTE)',
        enum: VoteType,
        example: VoteType.UPVOTE,
    })
    @IsEnum(VoteType)
    voteType: VoteType;
}

export class VoteResponseDto {
    @ApiProperty({
        description: 'ID của vote',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'ID của user thực hiện vote',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    userId: string;

    @ApiProperty({
        description: 'ID của luận điểm được vote',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    argumentId: string;

    @ApiProperty({
        description: 'Loại vote',
        enum: VoteType,
        example: VoteType.UPVOTE,
    })
    voteType: VoteType;

    @ApiProperty({
        description: 'Thời gian tạo vote',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;
}
