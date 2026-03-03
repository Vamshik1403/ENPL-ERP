// update-subcategory.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateSubCategoryDto {

  @IsOptional()
  @IsString()
  subCategoryId: string;
  
  @IsNotEmpty()
  @IsString()
  subCategoryName: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number; 
}
