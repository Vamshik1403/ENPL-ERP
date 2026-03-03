import { Module } from '@nestjs/common';
import { VendorPaymentService } from './vendor-payment.service';
import { VendorPaymentController } from './vendor-payment.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [VendorPaymentService,PrismaService],
  controllers: [VendorPaymentController]
})
export class VendorPaymentModule {}
