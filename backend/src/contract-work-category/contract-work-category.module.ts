import { Module } from '@nestjs/common';
import { ContractWorkCategoryService } from './contract-work-category.service';
import { ContractWorkCategoryController } from './contract-work-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ContractWorkCategoryController],
  providers: [ContractWorkCategoryService, PrismaService],
})
export class ContractWorkCategoryModule {}
