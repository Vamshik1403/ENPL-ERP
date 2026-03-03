import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { ServiceContractBillingService } from './service-contract-billing.service';
import { CreateServiceContractBillingDto } from './dto/create-service-contract-billing.dto';
import { UpdateServiceContractBillingDto } from './dto/update-service-contract-billing.dto';

@Controller('service-contract-billing')
export class ServiceContractBillingController {
  constructor(private readonly billingService: ServiceContractBillingService) {}

  // ➕ create one
  @Post()
  create(@Body() dto: CreateServiceContractBillingDto) {
    return this.billingService.create(dto);
  }



  // ➕ create many (bulk)
  @Post('bulk')
  createMany(
    @Body() body: { serviceContractTypeId: number; billings: CreateServiceContractBillingDto[] },
  ) {
    const billings = body.billings.map((b) => ({
      ...b,
      serviceContractTypeId: body.serviceContractTypeId,
    }));
    return this.billingService.createMany(billings);
  }

  // 🔍 list all billings for a specific contract type
@Get(':typeId')
findByTypeId(@Param('typeId') typeId: string) {
  return this.billingService.findByTypeId(+typeId);
}


  // ✏️ update specific record (e.g., mark as Paid)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceContractBillingDto) {
    return this.billingService.update(+id, dto);
  }

  // ❌ delete
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billingService.remove(+id);
  }
}
