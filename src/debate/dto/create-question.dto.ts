import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content: string;
}
