import { Module } from '@nestjs/common';
import { CustomerContactService } from './customer-contact.service';
import { CustomerContactController } from './customer-contact.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CustomerContactController],
  providers: [CustomerContactService, PrismaService],
})
export class CustomerContactModule {}
