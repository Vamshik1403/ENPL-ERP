import { Module } from '@nestjs/common';
import { ServiceContractInventoryService } from './service-contract-inventory.service';
import { ServiceContractInventoryController } from './service-contract-inventory.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractInventoryController],
  providers: [ServiceContractInventoryService, PrismaService],
})
export class ServiceContractInventoryModule {}
