import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialDeliveryItemDto {
  @IsOptional()
  @IsNumber()
  inventoryId?: number;

  @IsNumber()
  productId: number;

  @IsString()
  serialNumber: string;

  @IsString()
  macAddress: string;
}

export enum DeliveryType {
  Sale = 'Sale',
  Demo = 'Demo',
  PurchaseReturn = 'Purchase Return',
}


export class CreateMaterialDeliveryDto {
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsOptional()
  @IsString()
  refNumber?: string;

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
@IsNumber()
@Type(() => Number) // <-- Needed to transform string to number
siteId?: number;

  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsNumber()
  vendorId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDeliveryItemDto)
  materialDeliveryItems: MaterialDeliveryItemDto[];
}
