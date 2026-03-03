import { Module } from '@nestjs/common';
import { UserPermissionService } from './user-permission.service';
import { UserPermissionController } from './user-permission.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UserPermissionController],
  providers: [UserPermissionService,PrismaService],
})
export class UserPermissionModule {}
