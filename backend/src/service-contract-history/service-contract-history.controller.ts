import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServiceContractHistoryService } from './service-contract-history.service';
import { CreateServiceContractHistoryDto } from './dto/create-service-contract-history.dto';
import { UpdateServiceContractHistoryDto } from './dto/update-service-contract-history.dto';

@Controller('service-contract-history')
export class ServiceContractHistoryController {
  constructor(private readonly serviceContractHistoryService: ServiceContractHistoryService) {}

  @Post()
  create(@Body() dto: CreateServiceContractHistoryDto) {
    return this.serviceContractHistoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.serviceContractHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractHistoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceContractHistoryDto) {
    return this.serviceContractHistoryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractHistoryService.remove(id);
  }
}
