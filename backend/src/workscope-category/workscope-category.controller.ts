import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { WorkscopeCategoryService } from './workscope-category.service';
import { CreateWorkscopeCategoryDto } from './dto/create-workscope-category.dto';
import { UpdateWorkscopeCategoryDto } from './dto/update-workscope-category.dto';

@Controller('workscope-category')
export class WorkscopeCategoryController {
  constructor(private readonly workscopeCategoryService: WorkscopeCategoryService) {}

  @Post()
  create(@Body() createDto: CreateWorkscopeCategoryDto) {
    return this.workscopeCategoryService.create(createDto);
  }

  @Get()
  findAll() {
    return this.workscopeCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workscopeCategoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWorkscopeCategoryDto,
  ) {
    return this.workscopeCategoryService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workscopeCategoryService.remove(id);
  }
}
