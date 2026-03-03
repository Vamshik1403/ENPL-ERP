import { PartialType } from '@nestjs/mapped-types';
import { CreateTasksWorkscopeCategoryDto } from './create-task-workscope-category.dto';

export class UpdateTasksWorkscopeCategoryDto extends PartialType(CreateTasksWorkscopeCategoryDto) {}
