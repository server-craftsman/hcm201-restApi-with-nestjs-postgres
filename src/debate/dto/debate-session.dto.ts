import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { DebateSessionStatus, ParticipantRole } from '@prisma/client';

export class CreateDebateSessionDto {
    @ApiProperty({
        description: 'ID của chủ đề cho debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    topicId: string;

    @ApiProperty({
        description: 'Tiêu đề của debate session',
        example: 'Tranh luận về Tư tưởng Hồ Chí Minh - Buổi 1',
    })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Mô tả chi tiết về debate session',
        example: 'Buổi tranh luận đầu tiên về tư tưởng độc lập dân tộc của Hồ Chí Minh',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Thời gian bắt đầu debate session',
        example: '2024-01-20T14:00:00Z',
    })
    @IsDateString()
    startTime: string;

    @ApiProperty({
        description: 'Thời gian kết thúc debate session',
        example: '2024-01-20T16:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty({
        description: 'Giới hạn thời gian cho mỗi câu trả lời (phút)',
        example: 5,
        minimum: 1,
        maximum: 60,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(60)
    timeLimit?: number;

    @ApiProperty({
        description: 'Số lượng người tham gia tối đa',
        example: 10,
        minimum: 2,
        maximum: 50,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(50)
    maxParticipants?: number;
}

export class UpdateDebateSessionDto {
    @ApiProperty({
        description: 'Tiêu đề của debate session',
        example: 'Tranh luận về Tư tưởng Hồ Chí Minh - Buổi 1 (Đã cập nhật)',
        required: false,
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({
        description: 'Mô tả chi tiết về debate session',
        example: 'Buổi tranh luận đầu tiên về tư tưởng độc lập dân tộc của Hồ Chí Minh - Phiên bản cập nhật',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Trạng thái của debate session',
        enum: DebateSessionStatus,
        example: DebateSessionStatus.ACTIVE,
        required: false,
    })
    @IsOptional()
    @IsEnum(DebateSessionStatus)
    status?: DebateSessionStatus;

    @ApiProperty({
        description: 'Thời gian bắt đầu debate session',
        example: '2024-01-20T14:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    startTime?: string;

    @ApiProperty({
        description: 'Thời gian kết thúc debate session',
        example: '2024-01-20T16:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty({
        description: 'Giới hạn thời gian cho mỗi câu trả lời (phút)',
        example: 5,
        minimum: 1,
        maximum: 60,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(60)
    timeLimit?: number;

    @ApiProperty({
        description: 'Số lượng người tham gia tối đa',
        example: 10,
        minimum: 2,
        maximum: 50,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(50)
    maxParticipants?: number;
}

export class JoinDebateSessionDto {
    @ApiProperty({
        description: 'Vai trò của người tham gia',
        enum: ParticipantRole,
        example: ParticipantRole.PARTICIPANT,
        required: false,
    })
    @IsOptional()
    @IsEnum(ParticipantRole)
    role?: ParticipantRole;
}

export class DebateSessionResponseDto {
    @ApiProperty({
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'ID của chủ đề',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    topicId: string;

    @ApiProperty({
        description: 'Tiêu đề của debate session',
        example: 'Tranh luận về Tư tưởng Hồ Chí Minh - Buổi 1',
    })
    title: string;

    @ApiProperty({
        description: 'Mô tả chi tiết về debate session',
        example: 'Buổi tranh luận đầu tiên về tư tưởng độc lập dân tộc của Hồ Chí Minh',
    })
    description?: string;

    @ApiProperty({
        description: 'Trạng thái của debate session',
        enum: DebateSessionStatus,
        example: DebateSessionStatus.ACTIVE,
    })
    status: DebateSessionStatus;

    @ApiProperty({
        description: 'Thời gian bắt đầu debate session',
        example: '2024-01-20T14:00:00Z',
    })
    startTime: Date;

    @ApiProperty({
        description: 'Thời gian kết thúc debate session',
        example: '2024-01-20T16:00:00Z',
    })
    endTime?: Date;

    @ApiProperty({
        description: 'Giới hạn thời gian cho mỗi câu trả lời (phút)',
        example: 5,
    })
    timeLimit?: number;

    @ApiProperty({
        description: 'Số lượng người tham gia tối đa',
        example: 10,
    })
    maxParticipants?: number;

    @ApiProperty({
        description: 'Số lượng người tham gia hiện tại',
        example: 5,
    })
    currentParticipants: number;

    @ApiProperty({
        description: 'Thời gian tạo debate session',
        example: '2024-01-15T10:30:00Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Thời gian cập nhật cuối cùng',
        example: '2024-01-15T10:30:00Z',
    })
    updatedAt: Date;
}

export class DebateSessionParticipantResponseDto {
    @ApiProperty({
        description: 'ID của participant',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    sessionId: string;

    @ApiProperty({
        description: 'ID của user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    userId: string;

    @ApiProperty({
        description: 'Vai trò của người tham gia',
        enum: ParticipantRole,
        example: ParticipantRole.PARTICIPANT,
    })
    role: ParticipantRole;

    @ApiProperty({
        description: 'Thời gian tham gia',
        example: '2024-01-20T14:00:00Z',
    })
    joinedAt: Date;

    @ApiProperty({
        description: 'Thời gian rời khỏi session',
        example: '2024-01-20T16:00:00Z',
    })
    leftAt?: Date;

    @ApiProperty({
        description: 'Thông tin user',
        type: 'object',
    })
    user: {
        id: string;
        username: string;
        fullName?: string;
        avatar?: string;
    };
}
