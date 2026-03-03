import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CustomerContactService } from './customer-contact.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { AddSiteDto } from './dto/add-site.dto';

@Controller('customer-contact')
export class CustomerContactController {
  constructor(private readonly service: CustomerContactService) {}

      @Get('by-email')
findByEmail(@Query('email') email: string) {
  return this.service.findByEmail(email);
}

   @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }





  @Post()
  create(@Body() dto: CreateCustomerContactDto) {
    return this.service.create(dto);
  }

 



  

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerContactDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  // Mapping row actions (matches your UI add/remove row)
  @Post(':id/site')
  addSite(@Param('id') id: string, @Body() dto: AddSiteDto) {
    return this.service.addSite(+id, dto);
  }

  @Delete('site/:mappingId')
  removeSite(@Param('mappingId') mappingId: string) {
    return this.service.removeSite(+mappingId);
  }
}
