import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ModerationAction } from '../../database/schemas/moderation-log.schema';

export class ModerateArgumentDto {
    @ApiProperty({ description: 'ID luận điểm cần xử lý', example: 'argumentId123' })
    @IsString()
    argumentId: string;

    @ApiProperty({ description: 'Hành động', enum: ModerationAction, example: ModerationAction.APPROVE })
    @IsEnum(ModerationAction)
    action: ModerationAction;

    @ApiPropertyOptional({ description: 'Lý do (cho REJECT/FLAG)', example: 'Nội dung spam' })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({ description: 'Ghi chú', example: 'Đã cảnh báo người dùng' })
    @IsOptional()
    @IsString()
    notes?: string;
}


