import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ArgumentStatus, ArgumentType } from '../../database/schemas/argument.schema';

export class ModerationQueueQueryDto {
    @ApiPropertyOptional({ enum: ArgumentStatus, description: 'Filter by argument status' })
    @IsOptional()
    @IsEnum(ArgumentStatus)
    status?: ArgumentStatus;

    @ApiPropertyOptional({ enum: ArgumentType, description: 'Filter by side (support/oppose)' })
    @IsOptional()
    @IsEnum(ArgumentType)
    argumentType?: ArgumentType;

    @ApiPropertyOptional({ description: 'Filter by thread id' })
    @IsOptional()
    @IsMongoId()
    threadId?: string;

    @ApiPropertyOptional({ description: 'Free-text search in title/content' })
    @IsOptional()
    @IsString()
    search?: string;

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

    @ApiPropertyOptional({ description: 'Sort by field, e.g. createdAt:1' })
    @IsOptional()
    @IsString()
    sort?: string;
}


