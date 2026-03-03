import { Module } from '@nestjs/common';
import { EngineerService } from './engineer.service';
import { EngineerController } from './engineer.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [EngineerController],
  providers: [EngineerService, PrismaService],
  exports: [EngineerService],
})
export class EngineerModule {}
