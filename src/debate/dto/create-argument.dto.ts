import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl, IsArray, ArrayMaxSize, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArgumentType } from '../../database/schemas/argument.schema';

export class CreateArgumentDto {
    @ApiProperty({ description: 'Tiêu đề luận điểm', example: 'Tư tưởng độc lập dân tộc' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiProperty({
        description: 'Nội dung luận điểm tranh luận',
        example: 'Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo...',
        maxLength: 2000,
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;

    @ApiProperty({ description: 'ID chủ đề tranh luận', example: 'threadId123' })
    @IsString()
    @IsNotEmpty()
    threadId: string;

    // Optional metadata fields (accepted but not required)
    @ApiPropertyOptional({ description: 'Nguồn trích dẫn hoặc tham khảo', example: 'https://example.com/article' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    source?: string;

    @ApiPropertyOptional({ description: 'Danh sách URL bằng chứng', type: [String] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUrl({}, { each: true })
    evidenceUrls?: string[];

    // Accept argumentType from client to avoid 400, but service computes it from user's vote
    @ApiPropertyOptional({ enum: ArgumentType, description: 'Client-sent type (ignored by server, computed automatically)' })
    @IsOptional()
    @IsEnum(ArgumentType)
    argumentType?: ArgumentType;
}
