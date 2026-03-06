import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query,
  ParseIntPipe 
} from '@nestjs/common';
import { AddressBookService } from './address-book.service';
import { CreateAddressBookDto } from './dto/create-address-book.dto';
import { UpdateAddressBookDto } from './dto/update-address-book.dto';

import { ContactSearchDto } from './dto/contact-search.dto';
import { PaginationDto } from './dto/pagination.dto';
import { CreateAddressBookContactDto } from './dto/create-address-book-contact.dto';
import { UpdateAddressBookContactDto } from './dto/update-address-book-contact.dto';

@Controller('address-book')
export class AddressBookController {
  constructor(private readonly service: AddressBookService) {}

  // Address Book Endpoints
  @Post()
  create(@Body() dto: CreateAddressBookDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateAddressBookDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('next-id/:addressType')
  async getNextId(@Param('addressType') addressType: string) {
    const nextId = await this.service.generateNextId(addressType);
    return { nextId };
  }

  // Contact Management Endpoints (nested under address-book)
  @Get(':id/contacts')
  async findContacts(
    @Param('id', ParseIntPipe) id: number,
    @Query() pagination: PaginationDto
  ) {
    return this.service.findContacts(id, pagination);
  }

  @Get('contacts/search')
  async searchContacts(@Query() searchDto: ContactSearchDto) {
    return this.service.searchContacts(searchDto);
  }

  @Post(':id/contacts')
  async addContact(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Omit<CreateAddressBookContactDto, 'addressBookId'>
  ) {
    return this.service.addContact(id, data);
  }

  @Get('contacts/:contactId')
  async findOneContact(@Param('contactId', ParseIntPipe) contactId: number) {
    return this.service.findOneContact(contactId);
  }

  @Put('contacts/:contactId')
  async updateContact(
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() data: UpdateAddressBookContactDto
  ) {
    return this.service.updateContact(contactId, data);
  }

  @Delete('contacts/:contactId')
  async removeContact(@Param('contactId', ParseIntPipe) contactId: number) {
    return this.service.removeContact(contactId);
  }
}