import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProductTypeService } from './product.service';
import { CreateProductTypeDto } from './dto/create-product.dto';
import { UpdateProductTypeDto } from './dto/update-product.dto';

@Controller('producttype')
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  @Post()
  create(@Body() dto: CreateProductTypeDto) {
    return this.productTypeService.create(dto);
  }

  @Get()
  findAll() {
    return this.productTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productTypeService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductTypeDto) {
    return this.productTypeService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productTypeService.remove(+id);
  }
}
