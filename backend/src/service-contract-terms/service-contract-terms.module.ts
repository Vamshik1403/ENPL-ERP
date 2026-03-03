import { Module } from '@nestjs/common';
import { ServiceContractTermsService } from './service-contract-terms.service';
import { ServiceContractTermsController } from './service-contract-terms.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceContractTermsController],
  providers: [ServiceContractTermsService, PrismaService],
})
export class ServiceContractTermsModule {}
