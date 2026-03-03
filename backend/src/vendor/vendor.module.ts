import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [VendorController],
  providers: [VendorService,PrismaService]
})
export class VendorModule {}
