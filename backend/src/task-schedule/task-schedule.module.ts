import { Module } from '@nestjs/common';
import { TasksScheduleService } from './task-schedule.service';
import { TasksScheduleController } from './task-schedule.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TasksScheduleController],
  providers: [TasksScheduleService, PrismaService],
})
export class TasksScheduleModule {}
