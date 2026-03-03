import { Module } from '@nestjs/common';
import { TaskImagesService } from './task-images.service';
import { TaskImagesController } from './task-images.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TaskImagesController],
  providers: [TaskImagesService,PrismaService],
})
export class TaskImagesModule {}
