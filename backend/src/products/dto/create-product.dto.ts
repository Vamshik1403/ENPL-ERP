import { IsInt, IsString, IsOptional } from 'class-validator';

export class CreateProductDto {

  
  @IsInt()
  @IsOptional()
  id?: number;

  @IsString()
  productName: string;

  @IsString()
  productDescription: string;

  @IsString()
  HSN: string;

  @IsString()
  @IsOptional()
  unit: string;

  @IsString()
  @IsOptional()
  gstRate: string;

  @IsInt()
  categoryId: number;

  @IsInt()
  subCategoryId: number;
  
}
