import { ApiProperty } from '@nestjs/swagger';

export class ArgumentResponseDto {
    @ApiProperty({
        description: 'ID của luận điểm',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'Nội dung luận điểm',
        example: 'Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo...',
        type: String,
    })
    body: string;

    @ApiProperty({
        description: 'ID của tác giả luận điểm',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    authorId: string;

    @ApiProperty({
        description: 'ID của câu hỏi chứa luận điểm',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    questionId: string;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2024-01-15T10:30:00.000Z',
        type: Date,
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Thời gian cập nhật cuối',
        example: '2024-01-15T10:30:00.000Z',
        type: Date,
    })
    updatedAt: Date;
}

export class QuestionResponseDto {
    @ApiProperty({
        description: 'ID của câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'Nội dung câu hỏi',
        example: 'Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc?',
        type: String,
    })
    content: string;

    @ApiProperty({
        description: 'ID của chủ đề chứa câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2024-01-15T10:30:00.000Z',
        type: Date,
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Thời gian cập nhật cuối',
        example: '2024-01-15T10:30:00.000Z',
        type: Date,
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'Danh sách luận điểm cho câu hỏi',
        type: [ArgumentResponseDto],
        required: false,
    })
    arguments?: ArgumentResponseDto[];
}

export class TopicResponseDto {
    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'Tiêu đề chủ đề',
        example: 'Tư tưởng Hồ Chí Minh về độc lập dân tộc',
        type: String,
    })
    title: string;

    @ApiProperty({
        description: 'Mô tả chủ đề',
        example: 'Thảo luận về quan điểm của Hồ Chí Minh về việc giành và giữ độc lập dân tộc',
        type: String,
        nullable: true,
    })
    description: string | null;

    @ApiProperty({
        description: 'ID của người tạo chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    ownerId: string;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2024-01-15T10:30:00.000Z',
        type: Date,
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Thời gian cập nhật cuối',
        example: '2024-01-15T10:30:00.000Z',
        type: Date,
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'Danh sách câu hỏi trong chủ đề',
        type: [QuestionResponseDto],
        required: false,
    })
    questions?: QuestionResponseDto[];
}

export class DebateStatsResponseDto {
    @ApiProperty({
        description: 'Tổng số chủ đề',
        example: 25,
        type: Number,
    })
    totalTopics: number;

    @ApiProperty({
        description: 'Tổng số câu hỏi',
        example: 150,
        type: Number,
    })
    totalQuestions: number;

    @ApiProperty({
        description: 'Tổng số luận điểm',
        example: 450,
        type: Number,
    })
    totalArguments: number;

    @ApiProperty({
        description: 'Số người tham gia tranh luận',
        example: 30,
        type: Number,
    })
    activeParticipants: number;
}
