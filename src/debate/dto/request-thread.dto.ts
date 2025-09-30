import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsArray, ArrayMaxSize, IsUrl, IsEnum } from 'class-validator';

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

    // @ApiPropertyOptional({ description: 'Danh mục/chủ đề lớn', example: 'Triết học' })
    // @IsOptional()
    // @IsString()
    // @MaxLength(100)
    // category?: string;

    @ApiPropertyOptional({ description: 'Mô tả ngắn gọn (<=200 ký tự)', example: 'Tổng quan, lý do, phạm vi' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    summary?: string;

    @ApiPropertyOptional({ description: 'Mức độ quan trọng', enum: ['HIGH', 'MEDIUM', 'LOW'] })
    @IsOptional()
    @IsEnum(['HIGH', 'MEDIUM', 'LOW'] as any)
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';

    @ApiPropertyOptional({ description: 'Số người tham gia dự kiến', example: '20' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    expectedParticipants?: string;

    @ApiPropertyOptional({ description: 'Danh sách ảnh minh họa', type: [String] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUrl({}, { each: true })
    images?: string[];
}


