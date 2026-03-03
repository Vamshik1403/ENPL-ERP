import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()
  create(@Body() createSupportTicketDto: CreateSupportTicketDto) {
    return this.supportTicketsService.create(createSupportTicketDto);
  }

  @Get()
  findAll() {
    return this.supportTicketsService.findAll();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.supportTicketsService.findByStatus(status);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.supportTicketsService.findByCustomer(customerId);
  }

  @Get('next-id')
  getNextTicketId() {
    return this.supportTicketsService.getNextTicketId();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportTicketsService.findOne(id);
  }

  @Get('ticket/:ticketID')
  findByTicketId(@Param('ticketID') ticketID: string) {
    return this.supportTicketsService.findByTicketId(ticketID);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupportTicketDto: UpdateSupportTicketDto,
  ) {
    return this.supportTicketsService.update(id, updateSupportTicketDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportTicketsService.remove(id);
  }
}