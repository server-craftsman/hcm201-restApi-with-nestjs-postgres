import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestThreadDto {
    @ApiProperty({ description: 'Tiêu đề chủ đề yêu cầu tạo', example: 'Trí tuệ nhân tạo và quyền riêng tư' })
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ description: 'Mô tả', example: 'Đề xuất thảo luận về tác động của AI lên quyền riêng tư' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}


