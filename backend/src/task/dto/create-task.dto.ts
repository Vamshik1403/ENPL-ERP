import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType } from '@prisma/client';
import { CreateTaskPurchaseDto } from './create-task-purchase.dto';
import { TaskImageDto } from './task-image.dto'; // Add this

export class CreateTaskContactDto {
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;
}

export class CreateTaskWorkscopeDetailDto {
  @IsInt()
  @IsNotEmpty()
  workscopeCategoryId: number;

  @IsString()
  @IsNotEmpty()
  workscopeDetails: string;

  @IsOptional()
  @IsString()
  extraNote?: string;
}

export class CreateTaskScheduleDto {
  @IsString()
  @IsNotEmpty()
  proposedDateTime: string; // Frontend sends as ISO string

  @IsString()
  @IsNotEmpty()
  priority: string;
}

export class CreateTaskRemarkDto {
  @IsString()
  @IsNotEmpty()
  remark: string;

  @IsOptional() // Make status optional, will default to 'Open'
  @IsString()
  status?: string;
}

export class TaskInventoryDto {
  @IsInt()
  serviceContractId: number;

  @IsInt()
  productTypeId: number;

  @IsOptional()
  @IsString()
  makeModel?: string;

  @IsOptional()
  @IsString()
  snMac?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  purchaseDate?: string; // ISO string

  @IsOptional()
  @IsString()
  warrantyPeriod?: string;

  @IsOptional()
  @IsString()
  warrantyStatus?: string;

  @IsOptional()
  @IsBoolean()
  thirdPartyPurchase?: boolean;
}

export class CreateTaskDto {
  @IsInt()
  @IsOptional()
  departmentId: number;

  @IsInt()
  @IsOptional()
  addressBookId: number;

  @IsInt()
  @IsOptional()
  siteId: number;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  engineerId?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  attachment?: string; // Main task attachment

  @IsOptional()
  @IsString()
  priority?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskContactDto)
  contacts?: CreateTaskContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskWorkscopeDetailDto)
  workscopeDetails?: CreateTaskWorkscopeDetailDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskInventoryDto)
  taskInventories?: TaskInventoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskScheduleDto)
  schedule?: CreateTaskScheduleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskRemarkDto)
  remarks?: CreateTaskRemarkDto[];

  // 🔥 Add task images
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskImageDto)
  images?: TaskImageDto[];

  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTaskPurchaseDto)
  purchase?: CreateTaskPurchaseDto;
}