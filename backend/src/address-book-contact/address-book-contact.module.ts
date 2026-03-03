import { Module } from '@nestjs/common';
import { AddressBookContactService } from './address-book-contact.service';
import { AddressBookContactController } from './address-book-contact.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AddressBookContactController],
  providers: [AddressBookContactService, PrismaService],
})
export class AddressBookContactModule {}
