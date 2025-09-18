import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTopicDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;
}
