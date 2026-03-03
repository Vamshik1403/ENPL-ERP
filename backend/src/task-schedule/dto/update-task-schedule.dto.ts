import { PartialType } from '@nestjs/mapped-types';
import { CreateTasksScheduleDto } from './create-task-schedule.dto';

export class UpdateTasksScheduleDto extends PartialType(CreateTasksScheduleDto) {}
