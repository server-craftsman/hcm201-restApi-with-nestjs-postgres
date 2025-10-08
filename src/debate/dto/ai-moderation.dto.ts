import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ModerationStatus, RiskLevel, ModerationCategory } from '../../database/schemas/ai-moderation.schema';

export class AnalyzeContentDto {
    @ApiProperty({
        description: 'Nội dung argument cần phân tích',
        example: 'Tư tưởng Hồ Chí Minh về đức trị và pháp trị có ý nghĩa quan trọng trong xây dựng nhà nước pháp quyền...'
    })
    @IsString()
    content: string;

    @ApiProperty({
        description: 'Tiêu đề argument',
        example: 'Vai trò của đức trị trong tư tưởng Hồ Chí Minh'
    })
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'ID của argument (nếu đã tồn tại)',
        example: '68e5c1e22e1d47b30961496b'
    })
    @IsOptional()
    @IsString()
    argumentId?: string;
}

export class ReviewModerationDto {
    @ApiProperty({
        description: 'Trạng thái moderation sau khi review',
        enum: ModerationStatus,
        example: ModerationStatus.APPROVED
    })
    @IsEnum(ModerationStatus)
    status: ModerationStatus;

    @ApiPropertyOptional({
        description: 'Ghi chú của moderator',
        example: 'Nội dung có giá trị giáo dục cao, phù hợp với tư tưởng Hồ Chí Minh'
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Có override quyết định của AI không',
        example: false,
        default: false
    })
    @IsOptional()
    @IsBoolean()
    overrideAI?: boolean;
}

export class ModerationQueueQueryDto {
    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái moderation',
        enum: ModerationStatus,
        example: ModerationStatus.PENDING
    })
    @IsOptional()
    @IsEnum(ModerationStatus)
    status?: ModerationStatus;

    @ApiPropertyOptional({
        description: 'Lọc theo mức độ rủi ro',
        enum: RiskLevel,
        example: RiskLevel.HIGH
    })
    @IsOptional()
    @IsEnum(RiskLevel)
    riskLevel?: RiskLevel;

    @ApiPropertyOptional({
        description: 'Số trang',
        example: 1,
        minimum: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Số lượng items per page',
        example: 20,
        minimum: 1,
        maximum: 100
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;
}

export class FlaggedContentQueryDto {
    @ApiPropertyOptional({
        description: 'Số trang',
        example: 1,
        minimum: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Số lượng items per page',
        example: 20,
        minimum: 1,
        maximum: 100
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number;
}

// Response DTOs
export class AIModerationResultDto {
    @ApiProperty({ description: 'Có được approve không' })
    isApproved: boolean;

    @ApiProperty({ description: 'Độ tin cậy (0-1)', minimum: 0, maximum: 1 })
    confidence: number;

    @ApiProperty({ description: 'Lý do đánh giá', type: [String] })
    reasons: string[];

    @ApiProperty({ description: 'Mức độ rủi ro', enum: RiskLevel })
    riskLevel: RiskLevel;

    @ApiProperty({ description: 'Danh mục phân loại', type: [String] })
    categories: string[];

    @ApiPropertyOptional({ description: 'Gợi ý cải thiện', type: [String] })
    suggestions?: string[];
}

export class ContentAnalysisDto {
    @ApiProperty({ description: 'Sentiment của nội dung', enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] })
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

    @ApiProperty({ description: 'Mức độ độc hại (0-1)', minimum: 0, maximum: 1 })
    toxicity: number;

    @ApiProperty({ description: 'Thiên kiến chính trị (-1 đến 1)', minimum: -1, maximum: 1 })
    politicalBias: number;

    @ApiProperty({ description: 'Mức độ liên quan đến Hồ Chí Minh (0-1)', minimum: 0, maximum: 1 })
    hoChiMinhRelevance: number;

    @ApiProperty({ description: 'Giá trị giáo dục (0-1)', minimum: 0, maximum: 1 })
    educationalValue: number;
}

export class AIModerationResponseDto {
    @ApiProperty({ description: 'ID của moderation record' })
    _id: string;

    @ApiProperty({ description: 'ID của argument' })
    argumentId: string;

    @ApiProperty({ description: 'Trạng thái moderation', enum: ModerationStatus })
    status: ModerationStatus;

    @ApiProperty({ description: 'Mức độ rủi ro', enum: RiskLevel })
    riskLevel: RiskLevel;

    @ApiProperty({ description: 'Độ tin cậy', minimum: 0, maximum: 1 })
    confidence: number;

    @ApiProperty({ description: 'Danh mục phân loại', type: [String] })
    categories: string[];

    @ApiProperty({ description: 'Lý do đánh giá', type: [String] })
    reasons: string[];

    @ApiProperty({ description: 'Gợi ý cải thiện', type: [String] })
    suggestions: string[];

    @ApiProperty({ description: 'Kết quả phân tích AI', type: AIModerationResultDto })
    aiAnalysis: AIModerationResultDto;

    @ApiPropertyOptional({ description: 'Phân tích nội dung', type: ContentAnalysisDto })
    contentAnalysis?: ContentAnalysisDto;

    @ApiProperty({ description: 'Có được auto-approve không' })
    isAutoApproved: boolean;

    @ApiProperty({ description: 'Cần review thủ công không' })
    requiresHumanReview: boolean;

    @ApiProperty({ description: 'Số lần review', minimum: 0 })
    reviewCount: number;

    @ApiProperty({ description: 'AI models được sử dụng', type: [String] })
    aiModels: string[];

    @ApiProperty({ description: 'Thời gian tạo' })
    createdAt: Date;

    @ApiPropertyOptional({ description: 'Thời gian review' })
    reviewedAt?: Date;

    @ApiPropertyOptional({ description: 'Ghi chú review thủ công' })
    manualReviewNotes?: string;
}

export class ModerationQueueResponseDto {
    @ApiProperty({ description: 'Danh sách moderation records', type: [AIModerationResponseDto] })
    items: AIModerationResponseDto[];

    @ApiProperty({ description: 'Tổng số items' })
    totalItems: number;

    @ApiProperty({ description: 'Số trang hiện tại' })
    page: number;

    @ApiProperty({ description: 'Số items per page' })
    limit: number;
}

export class ModerationStatsDto {
    @ApiProperty({ description: 'Tổng số moderation records' })
    totalCount: number;

    @ApiProperty({ description: 'Thống kê theo status', type: [Object] })
    statusCounts: Array<{ _id: string; count: number }>;

    @ApiProperty({ description: 'Thống kê theo risk level', type: [Object] })
    riskLevelCounts: Array<{ _id: string; count: number }>;

    @ApiProperty({ description: 'Số lượng auto-approved' })
    autoApprovedCount: number;

    @ApiProperty({ description: 'Số lượng cần manual review' })
    manualReviewCount: number;

    @ApiProperty({ description: 'Thời gian tạo báo cáo' })
    timestamp: Date;
}

export class AccuracyMetricsDto {
    @ApiProperty({ description: 'Tổng số reviews' })
    totalReviews: number;

    @ApiProperty({ description: 'Số lần human override' })
    humanOverrides: number;

    @ApiProperty({ description: 'Tỷ lệ chính xác (%)' })
    accuracyRate: number;

    @ApiProperty({ description: 'Thống kê theo category', type: [Object] })
    categoryStats: Array<{ _id: string; count: number }>;

    @ApiProperty({ description: 'Thời gian tạo báo cáo' })
    timestamp: Date;
}

export class RetrainModelsResponseDto {
    @ApiProperty({ description: 'Thông báo' })
    message: string;

    @ApiProperty({ description: 'Trạng thái' })
    status: string;
}
