import { PartialType } from '@nestjs/mapped-types';
import { CreateTasksRemarksDto } from './create-task-remark.dto';

export class UpdateTasksRemarksDto extends PartialType(CreateTasksRemarksDto) {}
