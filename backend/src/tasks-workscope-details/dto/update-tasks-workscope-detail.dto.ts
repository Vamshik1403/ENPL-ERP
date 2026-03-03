import { PartialType } from '@nestjs/mapped-types';
import { CreateTasksWorkscopeDetailsDto } from './create-tasks-workscope-detail.dto';

export class UpdateTasksWorkscopeDetailsDto extends PartialType(CreateTasksWorkscopeDetailsDto) {}
