import { Module } from '@nestjs/common';
import { ServiceContractHistoryService } from './service-contract-history.service';
import { ServiceContractHistoryController } from './service-contract-history.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractHistoryController],
  providers: [ServiceContractHistoryService, PrismaService],
})
export class ServiceContractHistoryModule {}
