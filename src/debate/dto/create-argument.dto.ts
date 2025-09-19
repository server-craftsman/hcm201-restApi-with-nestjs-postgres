import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArgumentDto {
    @ApiProperty({
        description: 'Nội dung luận điểm tranh luận',
        example: 'Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo thông qua việc kết hợp đấu tranh chính trị với đấu tranh vũ trang, tạo nên sức mạnh tổng hợp để đánh bại các thế lực thực dân và đế quốc.',
        maxLength: 2000,
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    body: string;
}
