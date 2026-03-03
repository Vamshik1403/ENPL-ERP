// create-subcategory.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSubCategoryDto {
  @IsNotEmpty()
  @IsString()
  subCategoryId: string;

  @IsNotEmpty()
  @IsString()
  subCategoryName: string;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;
}

