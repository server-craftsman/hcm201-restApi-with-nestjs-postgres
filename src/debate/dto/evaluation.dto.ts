import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsUUID, IsObject } from 'class-validator';

export class CreateEvaluationDto {
    @ApiProperty({
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    sessionId: string;

    @ApiProperty({
        description: 'ID của người được đánh giá',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    participantId: string;

    @ApiProperty({
        description: 'Điểm số từ 1-10',
        example: 8,
        minimum: 1,
        maximum: 10,
    })
    @IsInt()
    @Min(1)
    @Max(10)
    score: number;

    @ApiProperty({
        description: 'Phản hồi chi tiết',
        example: 'Luận điểm rất sắc bén và có tính thuyết phục cao. Tuy nhiên cần bổ sung thêm ví dụ thực tế.',
        required: false,
    })
    @IsOptional()
    @IsString()
    feedback?: string;

    @ApiProperty({
        description: 'Đánh giá chi tiết theo các tiêu chí (JSON object)',
        example: {
            logic: 8,
            evidence: 7,
            presentation: 9,
            engagement: 8,
            originality: 6
        },
        required: false,
    })
    @IsOptional()
    @IsObject()
    criteria?: Record<string, number>;
}

export class UpdateEvaluationDto {
    @ApiProperty({
        description: 'Điểm số từ 1-10',
        example: 9,
        minimum: 1,
        maximum: 10,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    score?: number;

    @ApiProperty({
        description: 'Phản hồi chi tiết',
        example: 'Luận điểm rất sắc bén và có tính thuyết phục cao. Đã bổ sung thêm ví dụ thực tế rất tốt.',
        required: false,
    })
    @IsOptional()
    @IsString()
    feedback?: string;

    @ApiProperty({
        description: 'Đánh giá chi tiết theo các tiêu chí (JSON object)',
        example: {
            logic: 9,
            evidence: 8,
            presentation: 9,
            engagement: 9,
            originality: 7
        },
        required: false,
    })
    @IsOptional()
    @IsObject()
    criteria?: Record<string, number>;
}

export class EvaluationResponseDto {
    @ApiProperty({
        description: 'ID của đánh giá',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    sessionId: string;

    @ApiProperty({
        description: 'ID của người đánh giá',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    evaluatorId: string;

    @ApiProperty({
        description: 'ID của người được đánh giá',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    participantId: string;

    @ApiProperty({
        description: 'Điểm số từ 1-10',
        example: 8,
    })
    score: number;

    @ApiProperty({
        description: 'Phản hồi chi tiết',
        example: 'Luận điểm rất sắc bén và có tính thuyết phục cao. Tuy nhiên cần bổ sung thêm ví dụ thực tế.',
    })
    feedback?: string;

    @ApiProperty({
        description: 'Đánh giá chi tiết theo các tiêu chí',
        example: {
            logic: 8,
            evidence: 7,
            presentation: 9,
            engagement: 8,
            originality: 6
        },
    })
    criteria?: Record<string, number>;

    @ApiProperty({
        description: 'Thời gian tạo đánh giá',
        example: '2024-01-20T16:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Thông tin người đánh giá',
        type: 'object',
    })
    evaluator: {
        id: string;
        username: string;
        fullName?: string;
    };

    @ApiProperty({
        description: 'Thông tin người được đánh giá',
        type: 'object',
    })
    participant: {
        id: string;
        username: string;
        fullName?: string;
    };
}

export class DebateStatsResponseDto {
    @ApiProperty({
        description: 'Tổng số chủ đề',
        example: 15,
    })
    totalTopics: number;

    @ApiProperty({
        description: 'Tổng số câu hỏi',
        example: 45,
    })
    totalQuestions: number;

    @ApiProperty({
        description: 'Tổng số luận điểm',
        example: 120,
    })
    totalArguments: number;

    @ApiProperty({
        description: 'Tổng số debate sessions',
        example: 8,
    })
    totalSessions: number;

    @ApiProperty({
        description: 'Số debate sessions đang hoạt động',
        example: 2,
    })
    activeSessions: number;

    @ApiProperty({
        description: 'Tổng số vote',
        example: 350,
    })
    totalVotes: number;

    @ApiProperty({
        description: 'Tổng số đánh giá',
        example: 25,
    })
    totalEvaluations: number;

    @ApiProperty({
        description: 'Điểm trung bình của tất cả đánh giá',
        example: 7.8,
    })
    averageScore: number;
}
