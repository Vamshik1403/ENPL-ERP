import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AddressBookContactService } from './address-book-contact.service';
import { CreateAddressBookContactDto } from './dto/create-address-book-contact.dto';
import { UpdateAddressBookContactDto } from './dto/update-address-book-contact.dto';

@Controller('addressbookcontact')
export class AddressBookContactController {
  constructor(private readonly contactService: AddressBookContactService) {}

  @Post()
  create(@Body() dto: CreateAddressBookContactDto) {
    return this.contactService.create(dto);
  }

  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAddressBookContactDto) {
    return this.contactService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactService.remove(+id);
  }

  // Additional endpoints for better functionality
  @Get('by-address-book/:addressBookId')
  findByAddressBook(@Param('addressBookId') addressBookId: string) {
    return this.contactService.findByAddressBook(+addressBookId);
  }

  @Get('by-email/:email')
  findByEmail(@Param('email') email: string) {
    return this.contactService.findByEmail(email);
  }

  @Get('by-contact-number/:contactNumber')
  findByContactNumber(@Param('contactNumber') contactNumber: string) {
    return this.contactService.findByContactNumber(contactNumber);
  }

  @Get('search/:query')
  search(@Param('query') query: string) {
    return this.contactService.search(query);
  }
}
