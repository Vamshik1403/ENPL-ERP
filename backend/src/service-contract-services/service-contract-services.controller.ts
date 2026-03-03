import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServiceContractServicesService } from './service-contract-services.service';
import { CreateServiceContractServicesDto } from './dto/create-service-contract-service.dto';
import { UpdateServiceContractServicesDto } from './dto/update-service-contract-service.dto';

@Controller('service-contract-services')
export class ServiceContractServicesController {
  constructor(private readonly serviceContractServicesService: ServiceContractServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceContractServicesDto) {
    return this.serviceContractServicesService.create(dto);
  }

  @Get()
  findAll() {
    return this.serviceContractServicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractServicesService.findOne(id);
  }

  @Get('contract/:contractId')
findByContract(@Param('contractId', ParseIntPipe) contractId: number) {
  return this.serviceContractServicesService.findByContract(contractId);
}

@Delete('contract/:contractId')
removeByContract(@Param('contractId', ParseIntPipe) contractId: number) {
  return this.serviceContractServicesService.removeByContract(contractId);
}

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceContractServicesDto,
  ) {
    return this.serviceContractServicesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractServicesService.remove(id);
  }
}
