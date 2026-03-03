import { Module } from '@nestjs/common';
import { ServiceContractServicesService } from './service-contract-services.service';
import { ServiceContractServicesController } from './service-contract-services.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractServicesController],
  providers: [ServiceContractServicesService, PrismaService],
})
export class ServiceContractServicesModule {}
