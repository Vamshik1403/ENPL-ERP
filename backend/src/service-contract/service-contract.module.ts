import { Module } from '@nestjs/common';
import { ServiceContractService } from './service-contract.service';
import { ServiceContractController } from './service-contract.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractController],
  providers: [ServiceContractService, PrismaService],
})
export class ServiceContractModule {}
