import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TasksRemarksService } from './task-remarks.service';
import { CreateTasksRemarksDto } from './dto/create-task-remark.dto';
import { UpdateTasksRemarksDto } from './dto/update-task-remark.dto';

@Controller('tasks-remarks')
export class TasksRemarksController {
  constructor(private readonly service: TasksRemarksService) {}

  @Post()
  create(@Body() dto: CreateTasksRemarksDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTasksRemarksDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
