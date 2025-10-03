import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ArgumentStatus, ArgumentType } from '../../database/schemas/argument.schema';

export class AssignedArgumentsQueryDto {
    @ApiPropertyOptional({ enum: ArgumentStatus, description: 'Filter by argument status' })
    @IsOptional()
    @IsEnum(ArgumentStatus)
    status?: ArgumentStatus;

    @ApiPropertyOptional({ enum: ArgumentType, description: 'Filter by argument type (support/oppose)' })
    @IsOptional()
    @IsEnum(ArgumentType)
    argumentType?: ArgumentType;

    @ApiPropertyOptional({ description: 'Filter by specific thread id' })
    @IsOptional()
    @IsMongoId()
    threadId?: string;

    @ApiPropertyOptional({ description: 'Search in argument title/content' })
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

    @ApiPropertyOptional({ description: 'Sort by field (e.g., createdAt:1, createdAt:-1)', default: 'createdAt:-1' })
    @IsOptional()
    @IsString()
    sort?: string;

    @ApiPropertyOptional({ description: 'Include thread details in response', default: false })
    @IsOptional()
    includeThread?: boolean;
}
