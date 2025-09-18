import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateArgumentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    body: string;
}
