import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { DebateService } from './debate.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateArgumentDto } from './dto/create-argument.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateArgumentDto } from './dto/update-argument.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';

@ApiTags('Debate')
@Controller('debate')
@UseGuards(JwtAuthGuard)
export class DebateController {
    constructor(private readonly debateService: DebateService) { }

    // Topic endpoints
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo chủ đề mới',
        description: 'Tạo chủ đề mới',
    })
    @ApiResponse({
        status: 201,
        description: 'Chủ đề đã được tạo thành công',
        type: ApiResponseDto,
    })
    @Post('topics')
    async createTopic(@Body() createTopicDto: CreateTopicDto, @Request() req) {
        return await this.debateService.createTopic(createTopicDto, req.user.id);
    }

    @Get('topics')
    @ApiOperation({
        summary: 'Lấy danh sách chủ đề',
        description: 'Lấy danh sách chủ đề',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách chủ đề',
        type: ApiResponseDto,
    })
    async findAllTopics() {
        return await this.debateService.findAllTopics();
    }

    @Get('topics/my')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách chủ đề của tôi',
        description: 'Lấy danh sách chủ đề của tôi',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách chủ đề của tôi',
        type: ApiResponseDto,
    })
    async findMyTopics(@Request() req) {
        return await this.debateService.findTopicsByOwner(req.user.id);
    }

    @Get('topics/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết chủ đề',
        description: 'Lấy chi tiết chủ đề',
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết chủ đề',
        type: ApiResponseDto,
    })
    async findTopicById(@Param('id', ParseUUIDPipe) id: string) {
        return await this.debateService.findTopicById(id);
    }

    @Patch('topics/:id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật chủ đề',
        description: 'Cập nhật chủ đề',
    })
    @ApiResponse({
        status: 200,
        description: 'Chủ đề đã được cập nhật thành công',
        type: ApiResponseDto,
    })
    async updateTopic(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateTopicDto: UpdateTopicDto,
        @Request() req,
    ) {
        return await this.debateService.updateTopic(id, updateTopicDto, req.user.id);
    }

    @Delete('topics/:id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa chủ đề',
        description: 'Xóa chủ đề',
    })
    @ApiResponse({
        status: 200,
        description: 'Chủ đề đã được xóa thành công',
        type: ApiResponseDto,
    })
    async deleteTopic(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        await this.debateService.deleteTopic(id, req.user.id);
        return { message: 'Topic deleted successfully' };
    }

    // Question endpoints
    @Post('topics/:topicId/questions')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo câu hỏi mới',
        description: 'Tạo câu hỏi mới',
    })
    @ApiResponse({
        status: 201,
        description: 'Câu hỏi đã được tạo thành công',
        type: ApiResponseDto,
    })
    async createQuestion(
        @Param('topicId', ParseUUIDPipe) topicId: string,
        @Body() createQuestionDto: CreateQuestionDto,
        @Request() req,
    ) {
        return await this.debateService.createQuestion(topicId, createQuestionDto, req.user.id);
    }

    @Get('topics/:topicId/questions')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách câu hỏi theo chủ đề',
        description: 'Lấy danh sách câu hỏi theo chủ đề',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách câu hỏi theo chủ đề',
        type: ApiResponseDto,
    })
    async findQuestionsByTopic(@Param('topicId', ParseUUIDPipe) topicId: string) {
        return await this.debateService.findQuestionsByTopic(topicId);
    }

    @Get('questions/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết câu hỏi',
        description: 'Lấy chi tiết câu hỏi',
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết câu hỏi',
        type: ApiResponseDto,
    })
    async findQuestionById(@Param('id', ParseUUIDPipe) id: string) {
        return await this.debateService.findQuestionById(id);
    }

    @Patch('questions/:id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật câu hỏi',
        description: 'Cập nhật câu hỏi',
    })
    @ApiResponse({
        status: 200,
        description: 'Câu hỏi đã được cập nhật thành công',
        type: ApiResponseDto,
    })
    async updateQuestion(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateQuestionDto: UpdateQuestionDto,
        @Request() req,
    ) {
        return await this.debateService.updateQuestion(id, updateQuestionDto, req.user.id);
    }

    @Delete('questions/:id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa câu hỏi',
        description: 'Xóa câu hỏi',
    })
    @ApiResponse({
        status: 200,
        description: 'Câu hỏi đã được xóa thành công',
        type: ApiResponseDto,
    })
    async deleteQuestion(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        await this.debateService.deleteQuestion(id, req.user.id);
        return { message: 'Question deleted successfully' };
    }

    // Argument endpoints
    @Post('questions/:questionId/arguments')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo luận điểm mới',
        description: 'Tạo luận điểm mới',
    })
    @ApiResponse({
        status: 201,
        description: 'Luận điểm đã được tạo thành công',
        type: ApiResponseDto,
    })
    async createArgument(
        @Param('questionId', ParseUUIDPipe) questionId: string,
        @Body() createArgumentDto: CreateArgumentDto,
        @Request() req,
    ) {
        return await this.debateService.createArgument(questionId, createArgumentDto, req.user.id);
    }

    @Get('questions/:questionId/arguments')
    @ApiOperation({
        summary: 'Lấy danh sách luận điểm theo câu hỏi',
        description: 'Lấy danh sách luận điểm theo câu hỏi',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách luận điểm theo câu hỏi',
        type: ApiResponseDto,
    })
    async findArgumentsByQuestion(@Param('questionId', ParseUUIDPipe) questionId: string) {
        return await this.debateService.findArgumentsByQuestion(questionId);
    }

    @Get('arguments/my')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách luận điểm của tôi',
        description: 'Lấy danh sách luận điểm của tôi',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách luận điểm của tôi',
        type: ApiResponseDto,
    })
    async findMyArguments(@Request() req) {
        return await this.debateService.findArgumentsByAuthor(req.user.id);
    }

    @Get('arguments/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết luận điểm',
        description: 'Lấy chi tiết luận điểm',
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết luận điểm',
        type: ApiResponseDto,
    })
    async findArgumentById(@Param('id', ParseUUIDPipe) id: string) {
        return await this.debateService.findArgumentById(id);
    }

    @Patch('arguments/:id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật luận điểm',
        description: 'Cập nhật luận điểm',
    })
    @ApiResponse({
        status: 200,
        description: 'Luận điểm đã được cập nhật thành công',
        type: ApiResponseDto,
    })
    async updateArgument(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateArgumentDto: UpdateArgumentDto,
        @Request() req,
    ) {
        return await this.debateService.updateArgument(id, updateArgumentDto, req.user.id);
    }

    @Delete('arguments/:id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa luận điểm',
        description: 'Xóa luận điểm',
    })
    @ApiResponse({
        status: 200,
        description: 'Luận điểm đã được xóa thành công',
        type: ApiResponseDto,
    })
    async deleteArgument(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        await this.debateService.deleteArgument(id, req.user.id);
        return { message: 'Argument deleted successfully' };
    }
}
