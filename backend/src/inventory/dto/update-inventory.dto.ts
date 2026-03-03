import { IsString, IsNumber,  IsOptional, IsArray, IsDateString } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  vendorId?: number;
 
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
  
  @IsOptional()
  @IsString()
  purchaseInvoice?: string;

  @IsOptional()
  @IsString()
  creditTerms?: string;  

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  invoiceNetAmount?: string;

  @IsOptional()
  @IsString()
  gstAmount?: string;

  @IsOptional()
  @IsString()
  invoiceGrossAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

    @IsOptional()
  @IsString()
  dueAmount?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsArray()
  products?: {
    productId: number;
    make: string;
    model: string;
    serialNumber: string;
    macAddress: string;
    warrantyPeriod: string;
    purchaseRate: string;
  }[];
}
