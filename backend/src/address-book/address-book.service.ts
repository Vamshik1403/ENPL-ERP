import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressBookDto } from './dto/create-address-book.dto';
import { UpdateAddressBookDto } from './dto/update-address-book.dto';
import { UpdateAddressBookContactDto } from './dto/update-address-book-contact.dto';
import { ContactSearchDto } from './dto/contact-search.dto';
import { AddressBook, AddressBookContact, Prisma } from '@prisma/client';
import { CreateAddressBookContactDto } from './dto/create-address-book-contact.dto';

@Injectable()
export class AddressBookService {
  constructor(private prisma: PrismaService) {}

  // Address Book Methods
  async create(data: CreateAddressBookDto): Promise<AddressBook> {
    const addressBookID = await this.generateNextId('Customer');
    
    return this.prisma.addressBook.create({ 
      data: {
        ...data,
        addressType: 'Customer',
        addressBookID,
      } as Prisma.AddressBookCreateInput
    });
  }

  async findAll(pagination: { page?: number; limit?: number } = {}): Promise<{ data: AddressBook[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.addressBook.findMany({
        skip,
        take: limit,
        include: { 
          contacts: true, 
          sites: true, 
          tasks: true 
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.addressBook.count(),
    ]);

    return { data, total };
  }

  async findOne(id: number): Promise<AddressBook> {
    const addressBook = await this.prisma.addressBook.findUnique({
      where: { id },
      include: { 
        contacts: true, 
        sites: true, 
        tasks: true 
      },
    });

    if (!addressBook) {
      throw new NotFoundException(`Address book with ID ${id} not found`);
    }

    return addressBook;
  }

  async update(id: number, data: UpdateAddressBookDto): Promise<AddressBook> {
    try {
      return await this.prisma.addressBook.update({
        where: { id },
        data: data as Prisma.AddressBookUpdateInput,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Address book with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<AddressBook> {
    try {
      return await this.prisma.addressBook.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Address book with ID ${id} not found`);
      }
      throw error;
    }
  }

  async generateNextId(addressType: string): Promise<string> {
    const prefix = 'ENPL';
    
    try {
      const currentYear = new Date().getFullYear().toString();
      
      const count = await this.prisma.addressBook.count({
        where: { addressType }
      });
      
      const nextNumber = String(count + 1).padStart(4, '0');
      return `${prefix}/${currentYear}/${nextNumber}`;
    } catch (error) {
      console.error('Error generating next ID:', error);
      throw new Error('Failed to generate customer ID');
    }
  }

  // Contact Management Methods
  async findContacts(
    addressBookId: number, 
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: AddressBookContact[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Verify address book exists
    await this.findOne(addressBookId);

    const [data, total] = await Promise.all([
      this.prisma.addressBookContact.findMany({
        where: { addressBookId },
        skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      this.prisma.addressBookContact.count({ where: { addressBookId } }),
    ]);

    return { data, total };
  }

  async addContact(
    addressBookId: number, 
    data: Omit<CreateAddressBookContactDto, 'addressBookId'>
  ): Promise<AddressBookContact> {
    // Verify address book exists
    await this.findOne(addressBookId);

    // Create contact data with required fields
    const contactData: Prisma.AddressBookContactCreateInput = {
      contactPerson: data.contactPerson,
      contactNumber: data.contactNumber,
      designation: data.designation,
      emailAddress: data.emailAddress,
      addressBook: {
        connect: { id: addressBookId }
      }
    };

    return this.prisma.addressBookContact.create({
      data: contactData,
    });
  }

  async updateContact(
    contactId: number, 
    data: UpdateAddressBookContactDto
  ): Promise<AddressBookContact> {
    try {
      // Remove addressBookId from update data if present
      const { addressBookId, ...updateData } = data as any;
      
      return await this.prisma.addressBookContact.update({
        where: { id: contactId },
        data: updateData as Prisma.AddressBookContactUpdateInput,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contact with ID ${contactId} not found`);
      }
      throw error;
    }
  }

  async removeContact(contactId: number): Promise<AddressBookContact> {
    try {
      return await this.prisma.addressBookContact.delete({
        where: { id: contactId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Contact with ID ${contactId} not found`);
      }
      throw error;
    }
  }

  async findOneContact(contactId: number): Promise<AddressBookContact> {
    const contact = await this.prisma.addressBookContact.findUnique({
      where: { id: contactId },
      include: { addressBook: true },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    return contact;
  }

  async searchContacts(searchDto: ContactSearchDto): Promise<{ data: AddressBookContact[]; total: number }> {
    const { query, addressBookId, email, contactNumber, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const where: Prisma.AddressBookContactWhereInput = {};

    if (addressBookId) {
      where.addressBookId = addressBookId;
    }

    if (email) {
      where.emailAddress = { contains: email, mode: 'insensitive' };
    }

    if (contactNumber) {
      where.contactNumber = { contains: contactNumber };
    }

    if (query) {
      where.OR = [
        { contactPerson: { contains: query, mode: 'insensitive' } },
        { designation: { contains: query, mode: 'insensitive' } },
        { contactNumber: { contains: query, mode: 'insensitive' } },
        { emailAddress: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.addressBookContact.findMany({
        where,
        skip,
        take: limit,
        include: { addressBook: true },
        orderBy: { id: 'desc' },
      }),
      this.prisma.addressBookContact.count({ where }),
    ]);

    return { data, total };
  }
}