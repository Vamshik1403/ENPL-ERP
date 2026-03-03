import { Module } from '@nestjs/common';
import { TasksWorkscopeDetailsService } from './tasks-workscope-details.service';
import { TasksWorkscopeDetailsController } from './tasks-workscope-details.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TasksWorkscopeDetailsController],
  providers: [TasksWorkscopeDetailsService, PrismaService],
})
export class TasksWorkscopeDetailsModule {}
