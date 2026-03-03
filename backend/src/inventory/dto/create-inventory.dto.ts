import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductInput {
  @IsNumber()
  productId: number;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsString()
  @IsOptional()
  serialNumber: string;

  @IsString()
  @IsOptional()
  macAddress: string;

  @IsString()
  warrantyPeriod: string;

  @IsString()
  purchaseRate: string;

  @IsOptional()
  autoGenerateSerial?: boolean;
}

export class CreateInventoryDto {
  @IsNumber()
  vendorId: number;

  @IsDateString()
  purchaseDate: string;

  @IsString()
  purchaseInvoice: string;

  @IsString()
  creditTerms: string;

  @IsString()
  @IsOptional()
  dueDate: string;

  @IsString()
  invoiceNetAmount: string;

  @IsString()
  gstAmount: string;

  @IsString()
  invoiceGrossAmount: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  dueAmount?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductInput)
  products: ProductInput[];
}
