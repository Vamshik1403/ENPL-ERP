import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorPaymentDto } from './create-vendor-payment.dto';

export class UpdateVendorPaymentDto extends PartialType(CreateVendorPaymentDto) {}
