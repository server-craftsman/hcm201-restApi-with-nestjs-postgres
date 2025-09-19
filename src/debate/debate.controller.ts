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
} from '@nestjs/common';
import { UUIDValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { DebateService } from './debate.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateArgumentDto } from './dto/create-argument.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UpdateArgumentDto } from './dto/update-argument.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { TopicResponseDto, QuestionResponseDto, ArgumentResponseDto, DebateStatsResponseDto } from './dto/response.dto';

@ApiTags('Debate')
@Controller('debate')
export class DebateController {
    constructor(private readonly debateService: DebateService) { }

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
}
