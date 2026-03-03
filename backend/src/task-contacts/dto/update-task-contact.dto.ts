import { PartialType } from '@nestjs/mapped-types';
import { CreateTasksContactsDto } from './create-task-contact.dto';

export class UpdateTasksContactsDto extends PartialType(CreateTasksContactsDto) {}
