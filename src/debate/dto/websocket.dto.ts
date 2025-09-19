import { ApiProperty } from '@nestjs/swagger';
import { CreateQuestionDto } from './create-question.dto';
import { CreateArgumentDto } from './create-argument.dto';
import { QuestionResponseDto, ArgumentResponseDto } from './response.dto';

export class JoinTopicDto {
    @ApiProperty({
        description: 'ID của chủ đề cần tham gia',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;
}

export class LeaveTopicDto {
    @ApiProperty({
        description: 'ID của chủ đề cần rời khỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;
}

export class NewQuestionDto {
    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;

    @ApiProperty({
        description: 'Thông tin câu hỏi mới',
        type: CreateQuestionDto,
    })
    question: CreateQuestionDto;

    @ApiProperty({
        description: 'ID của người tạo câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    userId: string;
}

export class NewArgumentDto {
    @ApiProperty({
        description: 'ID của câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    questionId: string;

    @ApiProperty({
        description: 'Thông tin luận điểm mới',
        type: CreateArgumentDto,
    })
    argument: CreateArgumentDto;

    @ApiProperty({
        description: 'ID của người tạo luận điểm',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    userId: string;
}

export class TypingDto {
    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;

    @ApiProperty({
        description: 'ID của người đang gõ',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    userId: string;

    @ApiProperty({
        description: 'Trạng thái đang gõ',
        example: true,
        type: Boolean,
    })
    isTyping: boolean;
}

// WebSocket Response DTOs
export class JoinedTopicResponseDto {
    @ApiProperty({
        description: 'ID của chủ đề đã tham gia',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;
}

export class LeftTopicResponseDto {
    @ApiProperty({
        description: 'ID của chủ đề đã rời khỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;
}

export class QuestionAddedResponseDto {
    @ApiProperty({
        description: 'Câu hỏi mới được thêm',
        type: QuestionResponseDto,
    })
    question: QuestionResponseDto;

    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;
}

export class ArgumentAddedResponseDto {
    @ApiProperty({
        description: 'Luận điểm mới được thêm',
        type: ArgumentResponseDto,
    })
    argument: ArgumentResponseDto;

    @ApiProperty({
        description: 'ID của câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    questionId: string;

    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;
}

export class UserTypingResponseDto {
    @ApiProperty({
        description: 'ID của người đang gõ',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    userId: string;

    @ApiProperty({
        description: 'Trạng thái đang gõ',
        example: true,
        type: Boolean,
    })
    isTyping: boolean;
}

export class TopicUpdatedResponseDto {
    @ApiProperty({
        description: 'ID của chủ đề được cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;

    @ApiProperty({
        description: 'Thông tin cập nhật',
        type: Object,
    })
    update: any;
}

export class QuestionUpdatedResponseDto {
    @ApiProperty({
        description: 'ID của câu hỏi được cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    questionId: string;

    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;

    @ApiProperty({
        description: 'Thông tin cập nhật',
        type: Object,
    })
    update: any;
}

export class ArgumentUpdatedResponseDto {
    @ApiProperty({
        description: 'ID của luận điểm được cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    argumentId: string;

    @ApiProperty({
        description: 'ID của câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    questionId: string;

    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    topicId: string;

    @ApiProperty({
        description: 'Thông tin cập nhật',
        type: Object,
    })
    update: any;
}

export class ErrorResponseDto {
    @ApiProperty({
        description: 'Thông báo lỗi',
        example: 'Topic not found',
        type: String,
    })
    message: string;
}
