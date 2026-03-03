import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TasksWorkscopeCategoryService } from './task-workscope-category.service';
import { CreateTasksWorkscopeCategoryDto } from './dto/create-task-workscope-category.dto';
import { UpdateTasksWorkscopeCategoryDto } from './dto/update-task-workscope-category.dto';

@Controller('tasks-workscope-category')
export class TasksWorkscopeCategoryController {
  constructor(private readonly service: TasksWorkscopeCategoryService) {}

  @Post()
  create(@Body() dto: CreateTasksWorkscopeCategoryDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTasksWorkscopeCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
