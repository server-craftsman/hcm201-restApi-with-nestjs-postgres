import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopicDto {
    @ApiProperty({
        description: 'Tiêu đề chủ đề tranh luận',
        example: 'Tư tưởng Hồ Chí Minh về độc lập dân tộc',
        maxLength: 200,
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @ApiProperty({
        description: 'Mô tả chi tiết về chủ đề tranh luận',
        example: 'Thảo luận về quan điểm của Hồ Chí Minh về việc giành và giữ độc lập dân tộc trong bối cảnh lịch sử Việt Nam',
        maxLength: 1000,
        required: false,
        type: String,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;
}
