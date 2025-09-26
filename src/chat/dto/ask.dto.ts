import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AskDto {
    @ApiProperty({ description: 'User question to the support chat' })
    @IsString()
    @MaxLength(2000)
    question: string;

    @ApiPropertyOptional({ description: 'Optional context for better answers' })
    @IsOptional()
    context?: Record<string, unknown>;

    @ApiPropertyOptional({ description: 'Locale hint (e.g., vi, en)' })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    locale?: string;
}


