import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ServiceContractTermsService } from './service-contract-terms.service';
import { CreateServiceContractTermsDto } from './dto/create-service-contract-term.dto';
import { UpdateServiceContractTermsDto } from './dto/update-service-contract-term.dto';

@Controller('service-contract-terms')
export class ServiceContractTermsController {
  constructor(private readonly serviceContractTermsService: ServiceContractTermsService) {}

  @Post()
  create(@Body() createDto: CreateServiceContractTermsDto) {
    return this.serviceContractTermsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.serviceContractTermsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractTermsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateServiceContractTermsDto,
  ) {
    return this.serviceContractTermsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractTermsService.remove(id);
  }
}
