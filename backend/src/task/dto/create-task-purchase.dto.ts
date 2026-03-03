import {
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseType } from '@prisma/client';
import { CreateTaskPurchaseProductDto } from './create-task-purchase-product.dto';
import { CreateTaskPurchaseAttachmentDto } from './create-task-purchase-task-attachments.dto';

export class CreateTaskPurchaseDto {
  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  address?: string;

   @IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => CreateTaskPurchaseProductDto)
products?: CreateTaskPurchaseProductDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskPurchaseAttachmentDto)
  attachments?: CreateTaskPurchaseAttachmentDto[];
}