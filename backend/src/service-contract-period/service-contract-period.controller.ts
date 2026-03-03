import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServiceContractPeriodService } from './service-contract-period.service';
import { CreateServiceContractPeriodDto } from './dto/create-service-contract-period.dto';
import { UpdateServiceContractPeriodDto } from './dto/update-service-contract-period.dto';

@Controller('service-contract-period')
export class ServiceContractPeriodController {
  constructor(private readonly serviceContractPeriodService: ServiceContractPeriodService) {}

  @Post()
  create(@Body() createDto: CreateServiceContractPeriodDto) {
    return this.serviceContractPeriodService.create(createDto);
  }

  @Get()
  findAll() {
    return this.serviceContractPeriodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractPeriodService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateServiceContractPeriodDto,
  ) {
    return this.serviceContractPeriodService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractPeriodService.remove(id);
  }
}
