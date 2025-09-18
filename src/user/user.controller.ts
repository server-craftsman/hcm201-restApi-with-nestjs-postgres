import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ICreateUser, IUpdateUser } from './domain/interfaces/user.interface';
import { IPaginatedResponse } from '../utils/types/pagination-options';
import { ApiResponseDto, PaginatedResponseDto, ErrorResponseDto } from '../common/dto/api-response.dto';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { CurrentUser } from '../roles/decorators/current-user.decorator';
import { UserRole } from '../user/domain/interfaces/user.interface';

@ApiTags('Users')
@Controller({
    path: 'users',
    version: '1',
})
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @ApiOperation({
        summary: 'Tạo người dùng mới',
        description: 'Đăng ký người dùng mới vào hệ thống với thông tin chi tiết',
    })
    @ApiResponse({
        status: 201,
        description: 'Người dùng được tạo thành công',
        type: ApiResponseDto,
        schema: {
            example: {
                statusCode: 201,
                message: 'User created successfully',
                data: {
                    user: {
                        id: 'user-123',
                        email: 'user@example.com',
                        username: 'john_doe',
                        firstName: 'John',
                        lastName: 'Doe',
                        fullName: 'John Doe',
                        avatar: 'https://example.com/avatar.jpg',
                        phone: '+84123456789',
                        dateOfBirth: '1990-01-01T00:00:00.000Z',
                        gender: 'MALE',
                        bio: 'Tôi là một developer',
                        location: 'Hà Nội, Việt Nam',
                        website: 'https://example.com',
                        role: 'USER',
                        status: 'OFFLINE',
                        isVerified: false,
                        isActive: true,
                        lastSeen: '2024-01-01T00:00:00.000Z',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z',
                    },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: 409,
        description: 'Email hoặc username đã tồn tại',
        type: ErrorResponseDto,
    })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
        const userData: ICreateUser = {
            email: createUserDto.email,
            username: createUserDto.username,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            phone: createUserDto.phone,
            dateOfBirth: createUserDto.dateOfBirth,
            gender: createUserDto.gender,
            bio: createUserDto.bio,
            location: createUserDto.location,
            website: createUserDto.website,
            avatar: createUserDto.avatar,
            role: createUserDto.role,
        };
        const result = await this.userService.createUser(userData);
        return {
            statusCode: 201,
            message: 'User created successfully',
            data: { user: result },
            timestamp: new Date().toISOString(),
        };
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách người dùng với pagination',
        description: 'Lấy danh sách người dùng với phân trang, lọc và sắp xếp',
    })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Số items trên mỗi trang', example: 10 })
    @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm', example: 'john' })
    @ApiQuery({ name: 'status', required: false, description: 'Trạng thái người dùng', example: 'ONLINE' })
    @ApiQuery({ name: 'role', required: false, description: 'Vai trò người dùng', example: 'USER' })
    @ApiQuery({ name: 'sortBy', required: false, description: 'Sắp xếp theo field', example: 'createdAt' })
    @ApiQuery({ name: 'sortOrder', required: false, description: 'Thứ tự sắp xếp', example: 'DESC' })
    @ApiResponse({
        status: 200,
        description: 'Danh sách người dùng với pagination',
        type: ApiResponseDto,
    })
    async findAll(@Query() query: QueryUserDto): Promise<ApiResponseDto> {
        const result = await this.userService.findUsersWithPagination(query);
        return {
            statusCode: 200,
            message: 'Users retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy tất cả người dùng (không phân trang)',
        description: 'Lấy danh sách tất cả người dùng trong hệ thống',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách tất cả người dùng',
        type: ApiResponseDto,
    })
    async findAllWithoutPagination(): Promise<ApiResponseDto> {
        const users = await this.userService.findAllUsers();
        return {
            statusCode: 200,
            message: 'All users retrieved successfully',
            data: { users },
            timestamp: new Date().toISOString(),
        };
    }

    @Get('search')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tìm kiếm người dùng',
        description: 'Tìm kiếm người dùng theo email hoặc username',
    })
    @ApiQuery({
        name: 'q',
        required: true,
        description: 'Từ khóa tìm kiếm',
        example: 'john',
    })
    @ApiResponse({
        status: 200,
        description: 'Kết quả tìm kiếm',
        type: ApiResponseDto,
    })
    async searchUsers(@Query('q') searchTerm: string): Promise<ApiResponseDto> {
        const users = await this.userService.searchUsers(searchTerm);
        return {
            statusCode: 200,
            message: 'Search results retrieved successfully',
            data: { users },
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Thống kê người dùng',
        description: 'Lấy thống kê tổng quan về người dùng trong hệ thống',
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê người dùng',
        type: ApiResponseDto,
    })
    async getUsersStats(): Promise<ApiResponseDto> {
        const stats = await this.userService.getUsersStats();
        return {
            statusCode: 200,
            message: 'User statistics retrieved successfully',
            data: { stats },
            timestamp: new Date().toISOString(),
        };
    }

    @Get('online')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách người dùng đang online',
        description: 'Lấy danh sách tất cả người dùng đang online',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách người dùng online',
        type: ApiResponseDto,
    })
    async findOnlineUsers(): Promise<ApiResponseDto> {
        const users = await this.userService.findOnlineUsers();
        return {
            statusCode: 200,
            message: 'Online users retrieved successfully',
            data: { users },
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy thông tin người dùng theo ID',
        description: 'Lấy thông tin chi tiết của người dùng theo ID',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của người dùng',
        example: 'user-123',
    })
    @ApiResponse({
        status: 200,
        description: 'Thông tin người dùng',
        type: ApiResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Người dùng không tồn tại',
        type: ErrorResponseDto,
    })
    async findOne(@Param('id') id: string): Promise<ApiResponseDto> {
        const user = await this.userService.findUserById(id);
        return {
            statusCode: 200,
            message: 'User retrieved successfully',
            data: { user },
            timestamp: new Date().toISOString(),
        };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Cập nhật thông tin người dùng',
        description: 'Cập nhật thông tin người dùng theo ID',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của người dùng',
        example: 'user-123',
    })
    @ApiResponse({
        status: 200,
        description: 'Người dùng được cập nhật thành công',
        type: ApiResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Người dùng không tồn tại',
        type: ErrorResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'Email hoặc username đã tồn tại',
        type: ErrorResponseDto,
    })
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<ApiResponseDto> {
        const userData: IUpdateUser = {
            email: updateUserDto.email,
            username: updateUserDto.username,
            avatar: updateUserDto.avatar,
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName,
            phone: updateUserDto.phone,
            dateOfBirth: updateUserDto.dateOfBirth,
            gender: updateUserDto.gender,
            bio: updateUserDto.bio,
            location: updateUserDto.location,
            website: updateUserDto.website,
            role: updateUserDto.role,
        };
        const result = await this.userService.updateUser(id, userData);
        return {
            statusCode: 200,
            message: 'User updated successfully',
            data: { user: result },
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa người dùng',
        description: 'Xóa người dùng theo ID',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của người dùng',
        example: 'user-123',
    })
    @ApiResponse({
        status: 200,
        description: 'Người dùng được xóa thành công',
        type: ApiResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Người dùng không tồn tại',
        type: ErrorResponseDto,
    })
    async remove(@Param('id') id: string): Promise<ApiResponseDto> {
        await this.userService.deleteUser(id);
        return {
            statusCode: 200,
            message: 'User deleted successfully',
            data: { message: 'User deleted successfully' },
            timestamp: new Date().toISOString(),
        };
    }
} 