import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateVendorPaymentDto {


  @IsInt()
  vendorId: number;

  @IsString()
  purchaseInvoiceNo: string;

  @IsString()
  invoiceGrossAmount: string;

  @IsString()
  dueAmount: string;

  @IsString()
  paidAmount: string;

  @IsOptional()
  @IsString()
  balanceDue: string;

  @IsDateString()
  paymentDate: string;

  @IsString()
  paymentType: string;

  @IsString()
  referenceNo: string;

  @IsOptional()
  @IsString()
  remark: string;
}
