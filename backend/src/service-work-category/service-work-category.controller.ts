import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ServiceWorkCategoryService } from './service-work-category.service';
import { CreateServiceWorkCategoryDto } from './dto/create-service-work-category.dto';
import { UpdateServiceWorkCategoryDto } from './dto/update-service-work-category.dto';

@Controller(' ')
export class ServiceWorkCategoryController {
  constructor(private readonly serviceWorkService: ServiceWorkCategoryService) {}

  @Post()
  create(@Body() dto: CreateServiceWorkCategoryDto) {
    return this.serviceWorkService.create(dto);
  }

  @Get()
  findAll() {
    return this.serviceWorkService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceWorkService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceWorkCategoryDto) {
    return this.serviceWorkService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceWorkService.remove(+id);
  }
}
