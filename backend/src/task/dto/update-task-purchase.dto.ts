import { IsEnum, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseType } from '@prisma/client';
import { UpdateTaskPurchaseProductDto } from './update-task-purchaseProduct.dto';
import { CreateTaskPurchaseAttachmentDto } from './create-task-purchase-task-attachments.dto';


export class UpdateTaskPurchaseDto {
  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType?: PurchaseType;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // 🔥 If products array is provided, it must have at least 1 item
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTaskPurchaseProductDto)
  products?: UpdateTaskPurchaseProductDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskPurchaseAttachmentDto)
  attachments?: CreateTaskPurchaseAttachmentDto[];
}