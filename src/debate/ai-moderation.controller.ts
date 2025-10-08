import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from "../roles/guards/roles.guard";
import { Roles } from '../roles/decorators/roles.decorator';
import { UserRole } from '../database/schemas/user.schema';
import { AIModerationService } from './ai-moderation.service';
import { AIModeration, ModerationStatus, RiskLevel } from '../database/schemas/ai-moderation.schema';
import {
    AnalyzeContentDto,
    ReviewModerationDto,
    ModerationQueueQueryDto,
    FlaggedContentQueryDto,
    AIModerationResponseDto,
    ModerationQueueResponseDto,
    ModerationStatsDto,
    AccuracyMetricsDto,
    RetrainModelsResponseDto
} from './dto/ai-moderation.dto';

@ApiTags('AI Moderation')
@Controller('debate/ai-moderation')
export class AIModerationController {
    constructor(private readonly aiModerationService: AIModerationService) { }

    @Post('analyze')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Analyze content with AI moderation',
        description: 'Phân tích nội dung argument bằng AI để đánh giá tính phù hợp và rủi ro'
    })
    @ApiBody({ type: AnalyzeContentDto })
    @ApiResponse({
        status: 200,
        description: 'Content analyzed successfully',
        type: AIModerationResponseDto
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async analyzeContent(
        @Body() analyzeContentDto: AnalyzeContentDto,
        @Request() req
    ) {
        const { content, title, argumentId } = analyzeContentDto;
        const userId = req.user.id;

        return await this.aiModerationService.analyzeAndStore(
            content,
            title,
            argumentId,
            userId
        );
    }

    @Get('queue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get AI moderation queue',
        description: 'Lấy danh sách các argument cần moderation với filtering và pagination'
    })
    @ApiResponse({
        status: 200,
        description: 'Moderation queue retrieved successfully',
        type: ModerationQueueResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiQuery({ name: 'status', required: false, enum: ModerationStatus, description: 'Filter by moderation status' })
    @ApiQuery({ name: 'riskLevel', required: false, enum: RiskLevel, description: 'Filter by risk level' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async getModerationQueue(
        @Query() query: ModerationQueueQueryDto
    ) {
        return await this.aiModerationService.getModerationQueue(
            query.status,
            query.riskLevel,
            query.page,
            query.limit
        );
    }

    @Get('flagged')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get flagged content for manual review',
        description: 'Lấy danh sách nội dung được AI flag cần review thủ công'
    })
    @ApiResponse({
        status: 200,
        description: 'Flagged content retrieved successfully',
        type: ModerationQueueResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async getFlaggedContent(
        @Query() query: FlaggedContentQueryDto
    ) {
        return await this.aiModerationService.getFlaggedContent(query.page, query.limit);
    }

    @Patch(':id/review')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MODERATOR, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Manual review of AI moderation result',
        description: 'Review thủ công kết quả AI moderation và có thể override quyết định của AI'
    })
    @ApiBody({ type: ReviewModerationDto })
    @ApiResponse({
        status: 200,
        description: 'Review completed successfully',
        type: AIModerationResponseDto
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - AI moderation record not found' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async reviewModeration(
        @Param('id') id: string,
        @Body() reviewModerationDto: ReviewModerationDto,
        @Request() req
    ) {
        const { status, notes, overrideAI } = reviewModerationDto;
        const userId = req.user.id;

        return await this.aiModerationService.manualReview(
            id,
            status,
            userId,
            notes,
            overrideAI
        );
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get AI moderation statistics',
        description: 'Lấy thống kê tổng quan về AI moderation system'
    })
    @ApiResponse({
        status: 200,
        description: 'Statistics retrieved successfully',
        type: ModerationStatsDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async getModerationStats() {
        return await this.aiModerationService.getModerationStats();
    }

    @Get('accuracy')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get AI accuracy metrics',
        description: 'Lấy metrics về độ chính xác của AI và tỷ lệ human override'
    })
    @ApiResponse({
        status: 200,
        description: 'Accuracy metrics retrieved successfully',
        type: AccuracyMetricsDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async getAccuracyMetrics() {
        return await this.aiModerationService.getAccuracyMetrics();
    }

    @Post('retrain')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Retrain AI models with feedback',
        description: 'Khởi tạo quá trình retrain AI models dựa trên feedback từ human reviewers'
    })
    @ApiResponse({
        status: 200,
        description: 'Retraining initiated successfully',
        type: RetrainModelsResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    async retrainModels() {
        return await this.aiModerationService.retrainModels();
    }
}
