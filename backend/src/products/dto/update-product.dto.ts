import { IsInt, IsString, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsString()
  HSN?: string;

  @IsString()
  @IsOptional()
  unit: string;

  @IsString()
  @IsOptional()
  gstRate: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  subCategoryId?: number;
}
