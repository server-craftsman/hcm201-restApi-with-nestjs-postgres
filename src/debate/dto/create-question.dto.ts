import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
    @ApiProperty({
        description: 'Nội dung câu hỏi tranh luận',
        example: 'Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc trong cuộc đấu tranh giải phóng dân tộc?',
        maxLength: 500,
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content: string;
}
