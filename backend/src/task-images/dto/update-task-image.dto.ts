import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskImageDto } from './create-task-image.dto';

export class UpdateTaskImageDto extends PartialType(CreateTaskImageDto) {}
