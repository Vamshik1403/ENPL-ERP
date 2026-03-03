import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AddressBookService } from './address-book.service';
import { CreateAddressBookDto } from './dto/create-address-book.dto';
import { UpdateAddressBookDto } from './dto/update-address-book.dto';
import { AddressBookContact } from '@prisma/client';

@Controller('address-book')
export class AddressBookController {
  constructor(private readonly service: AddressBookService) {}

  @Post()
  create(@Body() dto: CreateAddressBookDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAddressBookDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Get('next-id/:addressType')
  async getNextId(@Param('addressType') addressType: string) {
    const nextId = await this.service.generateNextId(addressType);
    return { nextId };
  }

  // Contact management endpoints
  @Get(':id/contacts')
  async findContacts(@Param('id') id: string): Promise<AddressBookContact[]> {
    return this.service.findContacts(Number(id));
  }

  @Post(':id/contacts')
  async addContact(@Param('id') id: string, @Body() data: Omit<AddressBookContact, 'id' | 'addressBookId'>): Promise<AddressBookContact> {
    return this.service.addContact(Number(id), data);
  }

  @Put('contacts/:contactId')
  async updateContact(@Param('contactId') contactId: string, @Body() data: Partial<AddressBookContact>): Promise<AddressBookContact> {
    return this.service.updateContact(Number(contactId), data);
  }

  @Delete('contacts/:contactId')
  async removeContact(@Param('contactId') contactId: string): Promise<AddressBookContact> {
    return this.service.removeContact(Number(contactId));
  }

  @Get('contacts/:contactId')
  async findOneContact(@Param('contactId') contactId: string): Promise<AddressBookContact | null> {
    return this.service.findOneContact(Number(contactId));
  }
}
