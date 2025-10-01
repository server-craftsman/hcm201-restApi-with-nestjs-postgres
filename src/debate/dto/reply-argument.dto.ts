import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, IsUrl, ArrayMaxSize } from 'class-validator';

export class ReplyArgumentDto {
    @ApiProperty({
        description: 'Nội dung phản hồi luận điểm',
        example: 'Tôi không đồng ý với quan điểm này vì...',
        maxLength: 2000
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({
        description: 'Tiêu đề phản hồi (tùy chọn)',
        example: 'Phản hồi về luận điểm độc lập dân tộc',
        maxLength: 200
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional({
        description: 'Nguồn tham khảo hoặc liên kết',
        example: 'https://example.com/source'
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    source?: string;

    @ApiPropertyOptional({
        description: 'Danh sách URL bằng chứng (tối đa 5)',
        type: [String],
        example: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.pdf'],
    })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    @ArrayMaxSize(5)
    evidenceUrls?: string[];
}
