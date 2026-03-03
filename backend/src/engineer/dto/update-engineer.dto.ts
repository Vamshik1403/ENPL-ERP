import { PartialType } from '@nestjs/mapped-types';
import { CreateEngineerDto } from './create-engineer.dto';

export class UpdateEngineerDto extends PartialType(CreateEngineerDto) {}
