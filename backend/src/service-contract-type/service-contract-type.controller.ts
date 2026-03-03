import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ServiceContractTypeService } from './service-contract-type.service';
import { CreateServiceContractTypeDto } from './dto/create-service-contract-type.dto';
import { UpdateServiceContractTypeDto } from './dto/update-service-contract-type.dto';

@Controller('service-contract-type')
export class ServiceContractTypeController {
  constructor(private readonly service: ServiceContractTypeService) {}

  @Post()
  create(@Body() dto: CreateServiceContractTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceContractTypeDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
