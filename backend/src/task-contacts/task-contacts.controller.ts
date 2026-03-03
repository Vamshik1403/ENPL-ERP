import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TasksContactsService } from './task-contacts.service';
import { CreateTasksContactsDto } from './dto/create-task-contact.dto';
import { UpdateTasksContactsDto } from './dto/update-task-contact.dto';

@Controller('tasks-contacts')
export class TasksContactsController {
  constructor(private readonly tasksContactsService: TasksContactsService) {}

  @Post()
  create(@Body() dto: CreateTasksContactsDto) {
    return this.tasksContactsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tasksContactsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksContactsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTasksContactsDto) {
    return this.tasksContactsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksContactsService.remove(id);
  }
}
