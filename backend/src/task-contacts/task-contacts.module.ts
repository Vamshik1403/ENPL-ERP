import { Module } from '@nestjs/common';
import { TasksContactsService } from './task-contacts.service';
import { TasksContactsController } from './task-contacts.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TasksContactsController],
  providers: [TasksContactsService, PrismaService],
})
export class TasksContactsModule {}
