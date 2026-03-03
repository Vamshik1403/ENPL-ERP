import { Module } from '@nestjs/common';
import { ServiceContractTypeService } from './service-contract-type.service';
import { ServiceContractTypeController } from './service-contract-type.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractTypeController],
  providers: [ServiceContractTypeService,PrismaService],
})
export class ServiceContractTypeModule {}
