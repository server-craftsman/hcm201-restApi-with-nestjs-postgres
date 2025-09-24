import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
