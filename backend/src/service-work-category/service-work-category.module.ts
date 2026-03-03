import { Module } from '@nestjs/common';
import { ServiceWorkCategoryService } from './service-work-category.service';
import { ServiceWorkCategoryController } from './service-work-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ServiceWorkCategoryController],
  providers: [ServiceWorkCategoryService, PrismaService],
})
export class ServiceWorkCategoryModule {}
