import { Module } from '@nestjs/common';
import { MaterialDeliveryService } from './material-delivery.service';
import { MaterialDeliveryController } from './material-delivery.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [MaterialDeliveryController],
  providers: [MaterialDeliveryService, PrismaService],
})
export class MaterialDeliveryModule {}
