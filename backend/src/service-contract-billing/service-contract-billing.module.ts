import { Module } from '@nestjs/common';
import { ServiceContractBillingService } from './service-contract-billing.service';
import { ServiceContractBillingController } from './service-contract-billing.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractBillingController],
  providers: [ServiceContractBillingService,PrismaService],
})
export class ServiceContractBillingModule {}
