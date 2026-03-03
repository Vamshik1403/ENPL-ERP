import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServiceContractInventoryService } from './service-contract-inventory.service';
import { CreateServiceContractInventoryDto } from './dto/create-service-contract-inventory.dto';
import { UpdateServiceContractInventoryDto } from './dto/update-service-contract-inventory.dto';

@Controller('service-contract-inventory')
export class ServiceContractInventoryController {
  constructor(private readonly serviceContractInventoryService: ServiceContractInventoryService) {}

  @Post()
  create(@Body() dto: CreateServiceContractInventoryDto) {
    return this.serviceContractInventoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.serviceContractInventoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractInventoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceContractInventoryDto) {
    return this.serviceContractInventoryService.update(id, dto);
  }


  @Get('contract/:contractId')
findByContract(@Param('contractId', ParseIntPipe) contractId: number) {
  return this.serviceContractInventoryService.findByContract(contractId);
}

@Delete('contract/:contractId')
removeByContract(@Param('contractId', ParseIntPipe) contractId: number) {
  return this.serviceContractInventoryService.removeByContract(contractId);
}



  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractInventoryService.remove(id);
  }
}
