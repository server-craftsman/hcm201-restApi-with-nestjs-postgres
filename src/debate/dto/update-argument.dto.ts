import { PartialType } from '@nestjs/mapped-types';
import { CreateArgumentDto } from './create-argument.dto';

export class UpdateArgumentDto extends PartialType(CreateArgumentDto) { }
