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
    Query,
} from '@nestjs/common';
import { UUIDValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { DebateService } from './debate.service';
import { VotingService } from './voting.service';
import { DebateSessionService } from './debate-session.service';
import { EvaluationService } from './evaluation.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateArgumentDto } from './dto/create-argument.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateArgumentDto } from './dto/update-argument.dto';
import { CreateVoteDto, VoteResponseDto } from './dto/vote.dto';
import { CreateDebateSessionDto, UpdateDebateSessionDto, JoinDebateSessionDto, DebateSessionResponseDto, DebateSessionParticipantResponseDto } from './dto/debate-session.dto';
import { CreateEvaluationDto, UpdateEvaluationDto, EvaluationResponseDto, DebateStatsResponseDto } from './dto/evaluation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { TopicResponseDto, QuestionResponseDto, ArgumentResponseDto } from './dto/response.dto';

@ApiTags('Debate')
@Controller('debate')
export class DebateController {
    constructor(
        private readonly debateService: DebateService,
        private readonly votingService: VotingService,
        private readonly debateSessionService: DebateSessionService,
        private readonly evaluationService: EvaluationService,
    ) { }

    // Test endpoint for UUID validation
    @Get('test-uuid/:id')
    @ApiOperation({
        summary: 'Test UUID validation',
        description: 'Test endpoint to verify UUID validation is working correctly.',
    })
    @ApiParam({
        name: 'id',
        description: 'UUID to test',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'UUID is valid',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'UUID is valid' },
                uuid: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid UUID format',
    })
    async testUuid(@Param('id', UUIDValidationPipe) id: string) {
        return {
            message: 'UUID is valid',
            uuid: id
        };
    }

    // Topic endpoints
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo chủ đề mới',
        description: 'Tạo một chủ đề tranh luận mới. Chủ đề sẽ được tạo bởi user hiện tại và có thể chứa nhiều câu hỏi.',
    })
    @ApiResponse({
        status: 201,
        description: 'Chủ đề đã được tạo thành công',
        type: TopicResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiBody({
        type: CreateTopicDto,
        description: 'Thông tin chủ đề cần tạo',
        examples: {
            example1: {
                summary: 'Tạo chủ đề về tư tưởng Hồ Chí Minh',
                value: {
                    title: 'Tư tưởng Hồ Chí Minh về độc lập dân tộc',
                    description: 'Thảo luận về quan điểm của Hồ Chí Minh về việc giành và giữ độc lập dân tộc trong bối cảnh lịch sử Việt Nam'
                }
            }
        }
    })
    @Post('topics')
    @UseGuards(JwtAuthGuard)
    async createTopic(@Body() createTopicDto: CreateTopicDto, @Request() req) {
        return await this.debateService.createTopic(createTopicDto, req.user.id);
    }

    @Get('topics')
    @ApiOperation({
        summary: 'Lấy danh sách tất cả chủ đề',
        description: 'Lấy danh sách tất cả chủ đề tranh luận có trong hệ thống, sắp xếp theo thời gian tạo mới nhất.',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách chủ đề được trả về thành công',
        type: [TopicResponseDto],
    })
    async findAllTopics() {
        return await this.debateService.findAllTopics();
    }

    @Get('topics/my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách chủ đề của tôi',
        description: 'Lấy danh sách tất cả chủ đề tranh luận do user hiện tại tạo ra.',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách chủ đề của user được trả về thành công',
        type: [TopicResponseDto],
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    async findMyTopics(@Request() req) {
        return await this.debateService.findTopicsByOwner(req.user.id);
    }

    @Get('topics/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết chủ đề',
        description: 'Lấy thông tin chi tiết của một chủ đề tranh luận bao gồm tất cả câu hỏi và luận điểm.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chủ đề cần lấy thông tin',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết chủ đề được trả về thành công',
        type: TopicResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chủ đề với ID đã cho',
    })
    async findTopicById(@Param('id', UUIDValidationPipe) id: string) {
        return await this.debateService.findTopicById(id);
    }

    @Patch('topics/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật chủ đề',
        description: 'Cập nhật thông tin của một chủ đề tranh luận. Chỉ chủ sở hữu chủ đề mới có thể thực hiện thao tác này.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chủ đề cần cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Chủ đề đã được cập nhật thành công',
        type: TopicResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền cập nhật chủ đề này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chủ đề với ID đã cho',
    })
    @ApiBody({
        type: UpdateTopicDto,
        description: 'Thông tin cập nhật cho chủ đề',
        examples: {
            example1: {
                summary: 'Cập nhật tiêu đề và mô tả',
                value: {
                    title: 'Tư tưởng Hồ Chí Minh về độc lập dân tộc (Đã cập nhật)',
                    description: 'Thảo luận chi tiết về quan điểm của Hồ Chí Minh về việc giành và giữ độc lập dân tộc'
                }
            },
            example2: {
                summary: 'Chỉ cập nhật tiêu đề',
                value: {
                    title: 'Tư tưởng Hồ Chí Minh về độc lập dân tộc - Phiên bản mới'
                }
            }
        }
    })
    async updateTopic(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() updateTopicDto: UpdateTopicDto,
        @Request() req,
    ) {
        return await this.debateService.updateTopic(id, updateTopicDto, req.user.id);
    }

    @Delete('topics/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa chủ đề',
        description: 'Xóa một chủ đề tranh luận và tất cả câu hỏi, luận điểm liên quan. Chỉ chủ sở hữu chủ đề mới có thể thực hiện thao tác này.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chủ đề cần xóa',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Chủ đề đã được xóa thành công',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Topic deleted successfully'
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền xóa chủ đề này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chủ đề với ID đã cho',
    })
    async deleteTopic(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        await this.debateService.deleteTopic(id, req.user.id);
        return { message: 'Topic deleted successfully' };
    }

    // Question endpoints
    @Post('topics/:topicId/questions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo câu hỏi mới',
        description: 'Tạo một câu hỏi mới trong chủ đề tranh luận. Câu hỏi sẽ được gửi real-time đến tất cả user đang tham gia chủ đề.',
    })
    @ApiParam({
        name: 'topicId',
        description: 'ID của chủ đề cần tạo câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Câu hỏi đã được tạo thành công',
        type: QuestionResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chủ đề với ID đã cho',
    })
    @ApiBody({
        type: CreateQuestionDto,
        description: 'Nội dung câu hỏi cần tạo',
        examples: {
            example1: {
                summary: 'Tạo câu hỏi về tư tưởng Hồ Chí Minh',
                value: {
                    content: 'Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc trong cuộc đấu tranh giải phóng dân tộc?'
                }
            }
        }
    })
    async createQuestion(
        @Param('topicId', UUIDValidationPipe) topicId: string,
        @Body() createQuestionDto: CreateQuestionDto,
        @Request() req,
    ) {
        return await this.debateService.createQuestion(topicId, createQuestionDto, req.user.id);
    }

    @Get('topics/:topicId/questions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách câu hỏi theo chủ đề',
        description: 'Lấy danh sách tất cả câu hỏi trong một chủ đề tranh luận, sắp xếp theo thời gian tạo.',
    })
    @ApiParam({
        name: 'topicId',
        description: 'ID của chủ đề cần lấy danh sách câu hỏi',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách câu hỏi được trả về thành công',
        type: [QuestionResponseDto],
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chủ đề với ID đã cho',
    })
    async findQuestionsByTopic(@Param('topicId', UUIDValidationPipe) topicId: string) {
        return await this.debateService.findQuestionsByTopic(topicId);
    }

    @Get('questions/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết câu hỏi',
        description: 'Lấy thông tin chi tiết của một câu hỏi bao gồm tất cả luận điểm liên quan.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của câu hỏi cần lấy thông tin',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết câu hỏi được trả về thành công',
        type: QuestionResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy câu hỏi với ID đã cho',
    })
    async findQuestionById(@Param('id', UUIDValidationPipe) id: string) {
        return await this.debateService.findQuestionById(id);
    }

    @Patch('questions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật câu hỏi',
        description: 'Cập nhật nội dung của một câu hỏi. Mọi user đã xác thực đều có thể cập nhật câu hỏi.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của câu hỏi cần cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Câu hỏi đã được cập nhật thành công',
        type: QuestionResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy câu hỏi với ID đã cho',
    })
    @ApiBody({
        type: UpdateQuestionDto,
        description: 'Nội dung cập nhật cho câu hỏi',
        examples: {
            example1: {
                summary: 'Cập nhật nội dung câu hỏi',
                value: {
                    content: 'Làm thế nào Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc trong cuộc đấu tranh giải phóng dân tộc? (Đã cập nhật)'
                }
            }
        }
    })
    async updateQuestion(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() updateQuestionDto: UpdateQuestionDto,
        @Request() req,
    ) {
        return await this.debateService.updateQuestion(id, updateQuestionDto, req.user.id);
    }

    @Delete('questions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa câu hỏi',
        description: 'Xóa một câu hỏi và tất cả luận điểm liên quan. Mọi user đã xác thực đều có thể xóa câu hỏi.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của câu hỏi cần xóa',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Câu hỏi đã được xóa thành công',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Question deleted successfully'
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy câu hỏi với ID đã cho',
    })
    async deleteQuestion(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        await this.debateService.deleteQuestion(id, req.user.id);
        return { message: 'Question deleted successfully' };
    }

    // Argument endpoints
    @Post('questions/:questionId/arguments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo luận điểm mới',
        description: 'Tạo một luận điểm mới cho câu hỏi. Luận điểm sẽ được gửi real-time đến tất cả user đang tham gia chủ đề.',
    })
    @ApiParam({
        name: 'questionId',
        description: 'ID của câu hỏi cần tạo luận điểm',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Luận điểm đã được tạo thành công',
        type: ArgumentResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy câu hỏi với ID đã cho',
    })
    @ApiBody({
        type: CreateArgumentDto,
        description: 'Nội dung luận điểm cần tạo',
        examples: {
            example1: {
                summary: 'Tạo luận điểm về tư tưởng Hồ Chí Minh',
                value: {
                    body: 'Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo thông qua việc kết hợp đấu tranh chính trị với đấu tranh vũ trang, tạo nên sức mạnh tổng hợp để đánh bại các thế lực thực dân và đế quốc.'
                }
            }
        }
    })
    async createArgument(
        @Param('questionId', UUIDValidationPipe) questionId: string,
        @Body() createArgumentDto: CreateArgumentDto,
        @Request() req,
    ) {
        return await this.debateService.createArgument(questionId, createArgumentDto, req.user.id);
    }

    @Get('questions/:questionId/arguments')
    @ApiOperation({
        summary: 'Lấy danh sách luận điểm theo câu hỏi',
        description: 'Lấy danh sách tất cả luận điểm của một câu hỏi, sắp xếp theo thời gian tạo.',
    })
    @ApiParam({
        name: 'questionId',
        description: 'ID của câu hỏi cần lấy danh sách luận điểm',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách luận điểm được trả về thành công',
        type: [ArgumentResponseDto],
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy câu hỏi với ID đã cho',
    })
    async findArgumentsByQuestion(@Param('questionId', UUIDValidationPipe) questionId: string) {
        return await this.debateService.findArgumentsByQuestion(questionId);
    }

    @Get('arguments/my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách luận điểm của tôi',
        description: 'Lấy danh sách tất cả luận điểm do user hiện tại tạo ra.',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách luận điểm của user được trả về thành công',
        type: [ArgumentResponseDto],
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    async findMyArguments(@Request() req) {
        return await this.debateService.findArgumentsByAuthor(req.user.id);
    }

    @Get('arguments/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết luận điểm',
        description: 'Lấy thông tin chi tiết của một luận điểm.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của luận điểm cần lấy thông tin',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết luận điểm được trả về thành công',
        type: ArgumentResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy luận điểm với ID đã cho',
    })
    async findArgumentById(@Param('id', UUIDValidationPipe) id: string) {
        return await this.debateService.findArgumentById(id);
    }

    @Patch('arguments/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật luận điểm',
        description: 'Cập nhật nội dung của một luận điểm. Chỉ tác giả của luận điểm mới có thể thực hiện thao tác này.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của luận điểm cần cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Luận điểm đã được cập nhật thành công',
        type: ArgumentResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền cập nhật luận điểm này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy luận điểm với ID đã cho',
    })
    @ApiBody({
        type: UpdateArgumentDto,
        description: 'Nội dung cập nhật cho luận điểm',
        examples: {
            example1: {
                summary: 'Cập nhật nội dung luận điểm',
                value: {
                    body: 'Hồ Chí Minh đã vận dụng tư tưởng độc lập dân tộc một cách sáng tạo thông qua việc kết hợp đấu tranh chính trị với đấu tranh vũ trang, tạo nên sức mạnh tổng hợp để đánh bại các thế lực thực dân và đế quốc. (Đã cập nhật)'
                }
            }
        }
    })
    async updateArgument(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() updateArgumentDto: UpdateArgumentDto,
        @Request() req,
    ) {
        return await this.debateService.updateArgument(id, updateArgumentDto, req.user.id);
    }

    @Delete('arguments/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa luận điểm',
        description: 'Xóa một luận điểm. Chỉ tác giả của luận điểm mới có thể thực hiện thao tác này.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của luận điểm cần xóa',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Luận điểm đã được xóa thành công',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Argument deleted successfully'
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền xóa luận điểm này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy luận điểm với ID đã cho',
    })
    async deleteArgument(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        await this.debateService.deleteArgument(id, req.user.id);
        return { message: 'Argument deleted successfully' };
    }

    // ==================== VOTING ENDPOINTS ====================

    @Post('arguments/:argumentId/vote')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Vote cho luận điểm',
        description: 'Upvote hoặc downvote một luận điểm. Nếu đã vote thì sẽ bỏ vote hoặc đổi loại vote.',
    })
    @ApiParam({
        name: 'argumentId',
        description: 'ID của luận điểm cần vote',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Vote thành công',
        type: VoteResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy luận điểm',
    })
    @ApiBody({
        type: CreateVoteDto,
        description: 'Thông tin vote',
        examples: {
            upvote: {
                summary: 'Upvote luận điểm',
                value: {
                    argumentId: '123e4567-e89b-12d3-a456-426614174000',
                    voteType: 'UPVOTE'
                }
            },
            downvote: {
                summary: 'Downvote luận điểm',
                value: {
                    argumentId: '123e4567-e89b-12d3-a456-426614174000',
                    voteType: 'DOWNVOTE'
                }
            }
        }
    })
    async voteArgument(
        @Param('argumentId', UUIDValidationPipe) argumentId: string,
        @Body() createVoteDto: CreateVoteDto,
        @Request() req,
    ) {
        createVoteDto.argumentId = argumentId;
        return await this.votingService.voteArgument(req.user.id, createVoteDto);
    }

    @Delete('arguments/:argumentId/vote')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Bỏ vote cho luận điểm',
        description: 'Bỏ vote đã thực hiện cho một luận điểm.',
    })
    @ApiParam({
        name: 'argumentId',
        description: 'ID của luận điểm cần bỏ vote',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Bỏ vote thành công',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Vote removed successfully' }
            }
        }
    })
    async removeVote(
        @Param('argumentId', UUIDValidationPipe) argumentId: string,
        @Request() req,
    ) {
        await this.votingService.removeVote(req.user.id, argumentId);
        return { message: 'Vote removed successfully' };
    }

    @Get('arguments/:argumentId/vote-stats')
    @ApiOperation({
        summary: 'Lấy thống kê vote của luận điểm',
        description: 'Lấy thông tin chi tiết về số lượng vote và danh sách người vote.',
    })
    @ApiParam({
        name: 'argumentId',
        description: 'ID của luận điểm cần lấy thống kê',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê vote được trả về thành công',
    })
    async getArgumentVoteStats(@Param('argumentId', UUIDValidationPipe) argumentId: string) {
        return await this.votingService.getArgumentVoteStats(argumentId);
    }

    @Get('arguments/top')
    @ApiOperation({
        summary: 'Lấy top luận điểm có điểm cao nhất',
        description: 'Lấy danh sách các luận điểm có điểm số cao nhất.',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số lượng luận điểm tối đa',
        example: 10,
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách top luận điểm',
        type: [ArgumentResponseDto],
    })
    async getTopArguments(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return await this.votingService.getTopArguments(limitNum);
    }

    @Get('arguments/trending')
    @ApiOperation({
        summary: 'Lấy luận điểm trending',
        description: 'Lấy danh sách các luận điểm đang được vote nhiều gần đây.',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số lượng luận điểm tối đa',
        example: 10,
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách luận điểm trending',
        type: [ArgumentResponseDto],
    })
    async getTrendingArguments(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return await this.votingService.getTrendingArguments(limitNum);
    }

    @Get('my-votes')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách vote của tôi',
        description: 'Lấy tất cả các vote mà user hiện tại đã thực hiện.',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách vote của user',
        type: [VoteResponseDto],
    })
    async getMyVotes(@Request() req) {
        return await this.votingService.getUserVotes(req.user.id);
    }

    // ==================== DEBATE SESSION ENDPOINTS ====================

    @Post('sessions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo debate session mới',
        description: 'Tạo một phiên tranh luận mới với thời gian và giới hạn tham gia.',
    })
    @ApiResponse({
        status: 201,
        description: 'Debate session được tạo thành công',
        type: DebateSessionResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chủ đề',
    })
    @ApiBody({
        type: CreateDebateSessionDto,
        description: 'Thông tin debate session cần tạo',
        examples: {
            example1: {
                summary: 'Tạo debate session cơ bản',
                value: {
                    topicId: '123e4567-e89b-12d3-a456-426614174000',
                    title: 'Tranh luận về Tư tưởng Hồ Chí Minh - Buổi 1',
                    description: 'Buổi tranh luận đầu tiên về tư tưởng độc lập dân tộc',
                    startTime: '2024-01-20T14:00:00Z',
                    endTime: '2024-01-20T16:00:00Z',
                    timeLimit: 5,
                    maxParticipants: 10
                }
            }
        }
    })
    async createSession(@Body() createDto: CreateDebateSessionDto, @Request() req) {
        return await this.debateSessionService.createSession(req.user.id, createDto);
    }

    @Get('sessions')
    @ApiOperation({
        summary: 'Lấy danh sách debate sessions',
        description: 'Lấy danh sách tất cả debate sessions với tùy chọn lọc theo trạng thái.',
    })
    @ApiQuery({
        name: 'status',
        description: 'Trạng thái của session (SCHEDULED, ACTIVE, PAUSED, ENDED, CANCELLED)',
        example: 'ACTIVE',
        required: false,
        type: String,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số lượng session tối đa',
        example: 20,
        required: false,
        type: Number,
    })
    @ApiQuery({
        name: 'offset',
        description: 'Số lượng session bỏ qua',
        example: 0,
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách debate sessions',
        type: [DebateSessionResponseDto],
    })
    async getSessions(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        const offsetNum = offset ? parseInt(offset, 10) : 0;
        return await this.debateSessionService.getSessions(status as any, limitNum, offsetNum);
    }

    @Get('sessions/:id')
    @ApiOperation({
        summary: 'Lấy chi tiết debate session',
        description: 'Lấy thông tin chi tiết của một debate session bao gồm danh sách participants.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết debate session',
        type: DebateSessionResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async getSessionById(@Param('id', UUIDValidationPipe) id: string) {
        return await this.debateSessionService.getSessionById(id);
    }

    @Patch('sessions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật debate session',
        description: 'Cập nhật thông tin của debate session. Chỉ moderator mới có thể thực hiện.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session cần cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Debate session được cập nhật thành công',
        type: DebateSessionResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền cập nhật session',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async updateSession(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() updateDto: UpdateDebateSessionDto,
        @Request() req,
    ) {
        return await this.debateSessionService.updateSession(id, req.user.id, updateDto);
    }

    @Post('sessions/:id/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tham gia debate session',
        description: 'Tham gia vào một debate session với vai trò được chỉ định.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Tham gia session thành công',
        type: DebateSessionParticipantResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Session đã đầy hoặc đã tham gia',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    @ApiBody({
        type: JoinDebateSessionDto,
        description: 'Thông tin tham gia session',
        examples: {
            participant: {
                summary: 'Tham gia với vai trò participant',
                value: {
                    role: 'PARTICIPANT'
                }
            },
            observer: {
                summary: 'Tham gia với vai trò observer',
                value: {
                    role: 'OBSERVER'
                }
            }
        }
    })
    async joinSession(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() joinDto: JoinDebateSessionDto,
        @Request() req,
    ) {
        return await this.debateSessionService.joinSession(id, req.user.id, joinDto);
    }

    @Post('sessions/:id/leave')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Rời khỏi debate session',
        description: 'Rời khỏi debate session hiện tại.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Rời khỏi session thành công',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Left session successfully' }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Moderator không thể rời khỏi session',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session hoặc chưa tham gia',
    })
    async leaveSession(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        await this.debateSessionService.leaveSession(id, req.user.id);
        return { message: 'Left session successfully' };
    }

    @Post('sessions/:id/start')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Bắt đầu debate session',
        description: 'Bắt đầu một debate session đã được lên lịch. Chỉ moderator mới có thể thực hiện.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Session được bắt đầu thành công',
        type: DebateSessionResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Session không thể bắt đầu',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Chỉ moderator mới có thể bắt đầu session',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async startSession(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        return await this.debateSessionService.startSession(id, req.user.id);
    }

    @Post('sessions/:id/end')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Kết thúc debate session',
        description: 'Kết thúc một debate session đang hoạt động. Chỉ moderator mới có thể thực hiện.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Session được kết thúc thành công',
        type: DebateSessionResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Chỉ moderator mới có thể kết thúc session',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async endSession(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        return await this.debateSessionService.endSession(id, req.user.id);
    }

    @Get('sessions/:id/participants')
    @ApiOperation({
        summary: 'Lấy danh sách participants của session',
        description: 'Lấy danh sách tất cả người tham gia trong debate session.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách participants',
        type: [DebateSessionParticipantResponseDto],
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async getSessionParticipants(@Param('id', UUIDValidationPipe) id: string) {
        return await this.debateSessionService.getSessionParticipants(id);
    }

    @Get('sessions/:id/time-remaining')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Kiểm tra thời gian còn lại để trả lời',
        description: 'Kiểm tra thời gian còn lại để user có thể trả lời trong session.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Thông tin thời gian còn lại',
        schema: {
            type: 'object',
            properties: {
                timeRemaining: { type: 'number', example: 120 },
                canRespond: { type: 'boolean', example: true }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async getTimeRemaining(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        return await this.debateSessionService.getTimeRemaining(id, req.user.id);
    }

    // ==================== EVALUATION ENDPOINTS ====================

    @Post('evaluations')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo đánh giá cho participant',
        description: 'Tạo đánh giá cho một participant sau khi debate session kết thúc.',
    })
    @ApiResponse({
        status: 201,
        description: 'Đánh giá được tạo thành công',
        type: EvaluationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ hoặc đã đánh giá',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền đánh giá',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy session hoặc participant',
    })
    @ApiBody({
        type: CreateEvaluationDto,
        description: 'Thông tin đánh giá',
        examples: {
            example1: {
                summary: 'Đánh giá cơ bản',
                value: {
                    sessionId: '123e4567-e89b-12d3-a456-426614174000',
                    participantId: '123e4567-e89b-12d3-a456-426614174000',
                    score: 8,
                    feedback: 'Luận điểm rất sắc bén và có tính thuyết phục cao.',
                    criteria: {
                        logic: 8,
                        evidence: 7,
                        presentation: 9,
                        engagement: 8,
                        originality: 6
                    }
                }
            }
        }
    })
    async createEvaluation(@Body() createDto: CreateEvaluationDto, @Request() req) {
        return await this.evaluationService.createEvaluation(req.user.id, createDto);
    }

    @Patch('evaluations/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật đánh giá',
        description: 'Cập nhật đánh giá đã tạo. Chỉ người tạo đánh giá mới có thể cập nhật.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của đánh giá cần cập nhật',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Đánh giá được cập nhật thành công',
        type: EvaluationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu đầu vào không hợp lệ',
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền cập nhật đánh giá này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy đánh giá',
    })
    async updateEvaluation(
        @Param('id', UUIDValidationPipe) id: string,
        @Body() updateDto: UpdateEvaluationDto,
        @Request() req,
    ) {
        return await this.evaluationService.updateEvaluation(id, req.user.id, updateDto);
    }

    @Delete('evaluations/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa đánh giá',
        description: 'Xóa đánh giá đã tạo. Chỉ người tạo đánh giá mới có thể xóa.',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của đánh giá cần xóa',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Đánh giá được xóa thành công',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Evaluation deleted successfully' }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    @ApiResponse({
        status: 403,
        description: 'Không có quyền xóa đánh giá này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy đánh giá',
    })
    async deleteEvaluation(@Param('id', UUIDValidationPipe) id: string, @Request() req) {
        await this.evaluationService.deleteEvaluation(id, req.user.id);
        return { message: 'Evaluation deleted successfully' };
    }

    @Get('sessions/:sessionId/evaluations/participant/:participantId')
    @ApiOperation({
        summary: 'Lấy đánh giá của participant trong session',
        description: 'Lấy tất cả đánh giá của một participant trong debate session.',
    })
    @ApiParam({
        name: 'sessionId',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiParam({
        name: 'participantId',
        description: 'ID của participant',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách đánh giá của participant',
        type: [EvaluationResponseDto],
    })
    async getParticipantEvaluations(
        @Param('sessionId', UUIDValidationPipe) sessionId: string,
        @Param('participantId', UUIDValidationPipe) participantId: string,
    ) {
        return await this.evaluationService.getParticipantEvaluations(sessionId, participantId);
    }

    @Get('sessions/:sessionId/evaluations/my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy đánh giá của tôi trong session',
        description: 'Lấy tất cả đánh giá mà user hiện tại đã tạo trong debate session.',
    })
    @ApiParam({
        name: 'sessionId',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách đánh giá của user',
        type: [EvaluationResponseDto],
    })
    @ApiResponse({
        status: 401,
        description: 'Chưa xác thực hoặc token không hợp lệ',
    })
    async getMyEvaluations(
        @Param('sessionId', UUIDValidationPipe) sessionId: string,
        @Request() req,
    ) {
        return await this.evaluationService.getEvaluatorEvaluations(sessionId, req.user.id);
    }

    @Get('sessions/:sessionId/evaluation-stats')
    @ApiOperation({
        summary: 'Lấy thống kê đánh giá của session',
        description: 'Lấy thống kê chi tiết về đánh giá trong debate session.',
    })
    @ApiParam({
        name: 'sessionId',
        description: 'ID của debate session',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê đánh giá của session',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy debate session',
    })
    async getSessionEvaluationStats(@Param('sessionId', UUIDValidationPipe) sessionId: string) {
        return await this.evaluationService.getSessionEvaluationStats(sessionId);
    }

    @Get('evaluations/top-participants')
    @ApiOperation({
        summary: 'Lấy top participants có điểm cao nhất',
        description: 'Lấy danh sách participants có điểm đánh giá trung bình cao nhất.',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số lượng participants tối đa',
        example: 10,
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách top participants',
    })
    async getTopParticipants(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return await this.evaluationService.getTopParticipants(limitNum);
    }

    @Get('stats')
    @ApiOperation({
        summary: 'Lấy thống kê tổng quan hệ thống',
        description: 'Lấy thống kê tổng quan về toàn bộ hệ thống debate.',
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê tổng quan hệ thống',
        type: DebateStatsResponseDto,
    })
    async getSystemStats() {
        return await this.evaluationService.getSystemStats();
    }
}
