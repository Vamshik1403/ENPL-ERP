import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskPurchaseProductDto {
  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsString()
  vendor?: string;

  // send from frontend as string: "2026-01-09T14:47"
  @IsOptional()
  @IsDateString()
  validity?: string;

  @IsOptional()
  @IsString()
  availability?: string;
}
