import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
    @ApiProperty({
        description: 'Status code của response',
        example: 200,
    })
    statusCode: number;

    @ApiProperty({
        description: 'Thông báo response',
        example: 'Success',
    })
    message: string;

    @ApiProperty({
        description: 'Dữ liệu response',
        example: {},
    })
    data?: T;

    @ApiProperty({
        description: 'Thời gian response',
        example: '2024-01-01T00:00:00.000Z',
    })
    timestamp: string;
}

export class PaginatedResponseDto<T = any> {
    @ApiProperty({
        description: 'Danh sách dữ liệu',
        type: 'array',
    })
    items: T[];

    @ApiProperty({
        description: 'Tổng số items',
        example: 100,
    })
    total: number;

    @ApiProperty({
        description: 'Số trang hiện tại',
        example: 1,
    })
    page: number;

    @ApiProperty({
        description: 'Số items trên mỗi trang',
        example: 10,
    })
    limit: number;

    @ApiProperty({
        description: 'Tổng số trang',
        example: 10,
    })
    totalPages: number;
}

export class ErrorResponseDto {
    @ApiProperty({
        description: 'Status code lỗi',
        example: 400,
    })
    statusCode: number;

    @ApiProperty({
        description: 'Thông báo lỗi',
        example: 'Bad Request',
    })
    message: string;

    @ApiProperty({
        description: 'Loại lỗi',
        example: 'ValidationError',
    })
    error: string;

    @ApiProperty({
        description: 'Thời gian xảy ra lỗi',
        example: '2024-01-01T00:00:00.000Z',
    })
    timestamp: string;
} 