import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ContractWorkCategoryService } from './contract-work-category.service';
import { CreateContractWorkCategoryDto } from './dto/create-contract-work-category.dto';
import { UpdateContractWorkCategoryDto } from './dto/update-contract-work-category.dto';

@Controller('contractworkcategory')
export class ContractWorkCategoryController {
  constructor(private readonly contractWorkService: ContractWorkCategoryService) {}

  @Post()
  create(@Body() dto: CreateContractWorkCategoryDto) {
    return this.contractWorkService.create(dto);
  }

  @Get()
  findAll() {
    return this.contractWorkService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractWorkService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractWorkCategoryDto) {
    return this.contractWorkService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractWorkService.remove(+id);
  }
}
