import { Module } from '@nestjs/common';
import { WorkscopeCategoryService } from './workscope-category.service';
import { WorkscopeCategoryController } from './workscope-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [WorkscopeCategoryController],
  providers: [WorkscopeCategoryService, PrismaService],
})
export class WorkscopeCategoryModule {}
