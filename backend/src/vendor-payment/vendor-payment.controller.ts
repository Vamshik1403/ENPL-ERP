import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { VendorPaymentService } from './vendor-payment.service';
import { CreateVendorPaymentDto } from './dto/create-vendor-payment.dto';
import { UpdateVendorPaymentDto } from './dto/update-vendor-payment.dto';

@Controller('vendor-payment')
export class VendorPaymentController {
  constructor(private readonly vendorPaymentService: VendorPaymentService) {}

  // Create a new vendor payment
  @Post()
  create(@Body() createVendorPaymentDto: CreateVendorPaymentDto) {
    return this.vendorPaymentService.create(createVendorPaymentDto);
  }

  // Get all vendor payments
  @Get()
  findAll() {
    return this.vendorPaymentService.findAll();
  }

  // Get a single vendor payment by ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorPaymentService.findOne(id);
  }

  // Update a vendor payment by ID
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorPaymentDto: UpdateVendorPaymentDto,
  ) {
    return this.vendorPaymentService.update(id, updateVendorPaymentDto);
  }

  // Delete a vendor payment by ID
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorPaymentService.remove(id);
  }
}
