import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TasksScheduleService } from './task-schedule.service';
import { CreateTasksScheduleDto } from './dto/create-task-schedule.dto';
import { UpdateTasksScheduleDto } from './dto/update-task-schedule.dto';

@Controller('tasks-schedule')
export class TasksScheduleController {
  constructor(private readonly service: TasksScheduleService) {}

  @Post()
  create(@Body() dto: CreateTasksScheduleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTasksScheduleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
