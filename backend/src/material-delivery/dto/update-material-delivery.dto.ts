import { IsInt, IsString, IsOptional, IsNotEmpty, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateMaterialDeliveryItemDto {
  @IsInt()
  @IsNotEmpty()
  inventoryId: number;

  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  macAddress: string;

  @IsOptional()
  id?: number; // optional if updating existing items
}

export enum DeliveryType {
  Sale = 'Sale',
  Demo = 'Demo',
  PurchaseReturn = 'Purchase Return',
}


export class UpdateMaterialDeliveryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  duration?: string;

    @IsOptional()
    @IsNumber()
  siteId?: number;


   @IsOptional()
  @IsString()
  salesOrderNo?: string;
  @IsOptional()
  @IsString()
  quotationNo?: string;
  @IsOptional()
  @IsString()
  purchaseInvoiceNo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deliveryChallan?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refNumber?: string;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsInt()
  vendorId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMaterialDeliveryItemDto)
  materialDeliveryItems?: UpdateMaterialDeliveryItemDto[];
}
