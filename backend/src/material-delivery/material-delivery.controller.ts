import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put } from '@nestjs/common';
import { MaterialDeliveryService } from './material-delivery.service';
import { CreateMaterialDeliveryDto } from './dto/create-material-delivery.dto';
import { UpdateMaterialDeliveryDto } from './dto/update-material-delivery.dto';

@Controller('material-delivery')
export class MaterialDeliveryController {
  constructor(private readonly service: MaterialDeliveryService) {}

  @Post()
  create(@Body() dto: CreateMaterialDeliveryDto) {
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

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialDeliveryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
