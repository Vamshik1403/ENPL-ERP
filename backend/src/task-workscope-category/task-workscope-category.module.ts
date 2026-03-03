import { Module } from '@nestjs/common';
import { TasksWorkscopeCategoryService } from './task-workscope-category.service';
import { TasksWorkscopeCategoryController } from './task-workscope-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TasksWorkscopeCategoryController],
  providers: [TasksWorkscopeCategoryService, PrismaService],
})
export class TasksWorkscopeCategoryModule {}
