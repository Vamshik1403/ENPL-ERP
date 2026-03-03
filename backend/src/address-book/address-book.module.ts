import { Module } from '@nestjs/common';
import { AddressBookService } from './address-book.service';
import { AddressBookController } from './address-book.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AddressBookController],
  providers: [AddressBookService, PrismaService],
})
export class AddressBookModule {}
