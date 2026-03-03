import { Module } from '@nestjs/common';
import { ProductTypeService } from './product.service';
import { ProductTypeController } from './product.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductTypeController],
  providers: [ProductTypeService, PrismaService],
})
export class ProductTypeModule {}
