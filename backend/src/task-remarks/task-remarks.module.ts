import { Module } from '@nestjs/common';
import { TasksRemarksService } from './task-remarks.service';
import { TasksRemarksController } from './task-remarks.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TasksRemarksController],
  providers: [TasksRemarksService, PrismaService],
})
export class TasksRemarksModule {}
