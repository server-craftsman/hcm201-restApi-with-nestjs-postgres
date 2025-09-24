import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateThreadDto {
    @ApiProperty({ description: 'Tiêu đề chủ đề tranh luận', example: 'AI có nên được cấp quyền công dân?' })
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ description: 'Mô tả chủ đề', example: 'Thảo luận đa chiều về quyền và trách nhiệm của AI.' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({ description: 'Danh sách moderator (ID người dùng)', type: [String], example: ['u1', 'u2'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    moderators?: string[];

    @ApiPropertyOptional({ description: 'Moderator cho phe A', example: 'modAId' })
    @IsOptional()
    @IsString()
    modForSideA?: string;

    @ApiPropertyOptional({ description: 'Moderator cho phe B', example: 'modBId' })
    @IsOptional()
    @IsString()
    modForSideB?: string;

    @ApiPropertyOptional({ description: 'Ngày bắt đầu', example: '2025-09-23T10:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Ngày kết thúc', example: '2025-10-01T10:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Cho phép bỏ phiếu', default: true })
    @IsOptional()
    @IsBoolean()
    allowVoting?: boolean;

    @ApiPropertyOptional({ description: 'Cho phép đăng luận điểm', default: true })
    @IsOptional()
    @IsBoolean()
    allowArguments?: boolean;

    @ApiPropertyOptional({ description: 'Yêu cầu duyệt luận điểm', default: true })
    @IsOptional()
    @IsBoolean()
    requireModeration?: boolean;
}


