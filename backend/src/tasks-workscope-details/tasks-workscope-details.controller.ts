import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TasksWorkscopeDetailsService } from './tasks-workscope-details.service';
import { CreateTasksWorkscopeDetailsDto } from './dto/create-tasks-workscope-detail.dto';
import { UpdateTasksWorkscopeDetailsDto } from './dto/update-tasks-workscope-detail.dto';

@Controller('tasks-workscope-details')
export class TasksWorkscopeDetailsController {
  constructor(private readonly service: TasksWorkscopeDetailsService) {}

  @Post()
  create(@Body() dto: CreateTasksWorkscopeDetailsDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTasksWorkscopeDetailsDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
