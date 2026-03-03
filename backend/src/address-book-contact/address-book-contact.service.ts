import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddressBookContactDto } from './dto/create-address-book-contact.dto';
import { UpdateAddressBookContactDto } from './dto/update-address-book-contact.dto';

@Injectable()
export class AddressBookContactService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateAddressBookContactDto) {
    return this.prisma.addressBookContact.create({ data });
  }

  findAll() {
    return this.prisma.addressBookContact.findMany({
      include: { addressBook: true },
      orderBy: { id: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.addressBookContact.findUnique({
      where: { id },
      include: { addressBook: true },
    });
  }

  update(id: number, data: UpdateAddressBookContactDto) {
    return this.prisma.addressBookContact.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.addressBookContact.delete({
      where: { id },
    });
  }

  // Additional methods for better functionality
  async findByAddressBook(addressBookId: number) {
    return this.prisma.addressBookContact.findMany({
      where: { addressBookId },
      include: { addressBook: true },
      orderBy: { id: 'desc' },
    });
  }

  async findByEmail(emailAddress: string) {
    return this.prisma.addressBookContact.findMany({
      where: { emailAddress },
      include: { addressBook: true },
    });
  }

  async findByContactNumber(contactNumber: string) {
    return this.prisma.addressBookContact.findMany({
      where: { contactNumber },
      include: { addressBook: true },
    });
  }

  async search(query: string) {
    return this.prisma.addressBookContact.findMany({
      where: {
        OR: [
          { contactPerson: { contains: query, mode: 'insensitive' } },
          { designation: { contains: query, mode: 'insensitive' } },
          { contactNumber: { contains: query, mode: 'insensitive' } },
          { emailAddress: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { addressBook: true },
      orderBy: { id: 'desc' },
    });
  }
}
