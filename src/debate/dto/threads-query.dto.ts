import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ThreadStatus } from '../../database/schemas/debate-thread.schema';

export class ThreadsQueryDto {
    @ApiPropertyOptional({ enum: ThreadStatus })
    @IsOptional()
    @IsEnum(ThreadStatus)
    status?: ThreadStatus;

    @ApiPropertyOptional({ description: 'Free-text search in title/description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by creator user id' })
    @IsOptional()
    @IsMongoId()
    createdBy?: string;

    @ApiPropertyOptional({ description: 'Filter by moderator user id' })
    @IsOptional()
    @IsMongoId()
    moderatorId?: string;

    @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Page size', default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Sort by field, e.g. createdAt:-1 or title:1' })
    @IsOptional()
    @IsString()
    sort?: string;
}


