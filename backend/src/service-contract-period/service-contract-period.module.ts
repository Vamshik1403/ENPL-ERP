import { Module } from '@nestjs/common';
import { ServiceContractPeriodService } from './service-contract-period.service';
import { ServiceContractPeriodController } from './service-contract-period.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractPeriodController],
  providers: [ServiceContractPeriodService, PrismaService],
})
export class ServiceContractPeriodModule {}
