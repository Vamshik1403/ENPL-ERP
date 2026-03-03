import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { SitesService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateSiteContactDto } from './dto/create-site-contact.dto';
import { UpdateSiteContactDto } from './dto/update-site-contact.dto';

@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SitesService) {}

  @Get('based-on-cust')
  findAllBasedOnCust(
    @Query('addressBookId', new ParseIntPipe({ optional: true }))
    addressBookId?: number,
  ) {
    return this.siteService.findAllBasedOnCust(addressBookId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSiteDto) {
    return this.siteService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSiteDto: UpdateSiteDto) {
    return this.siteService.update(id, updateSiteDto);
  }

  @Get()
  findAll() {
    return this.siteService.findAll();
  }

  // Contact endpoints
  @Get(':id/contacts')
  getContacts(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.getSiteContacts(id);
  }

  @Post(':id/contacts')
  addContact(@Param('id', ParseIntPipe) id: number, @Body() createContactDto: CreateSiteContactDto) {
    return this.siteService.createSiteContact(id, createContactDto);
  }

  @Put('contacts/:contactId')
  updateContact(@Param('contactId', ParseIntPipe) contactId: number, @Body() updateContactDto: UpdateSiteContactDto) {
    return this.siteService.updateSiteContact(contactId, updateContactDto);
  }

  @Delete('contacts/:contactId')
  removeContact(@Param('contactId', ParseIntPipe) contactId: number) {
    return this.siteService.deleteSiteContact(contactId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.remove(id);
  }
}