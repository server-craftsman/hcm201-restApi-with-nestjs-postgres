import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ThreadStatus } from '../../database/schemas/debate-thread.schema';

export class UpdateThreadStatusDto {
    @ApiProperty({
        description: 'Trạng thái mới của chủ đề',
        enum: ThreadStatus,
        example: ThreadStatus.PAUSED
    })
    @IsEnum(ThreadStatus)
    status: ThreadStatus;

    @ApiPropertyOptional({
        description: 'Lý do thay đổi trạng thái (bắt buộc khi từ chối)',
        example: 'Nội dung không phù hợp với quy định',
        maxLength: 500
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}
