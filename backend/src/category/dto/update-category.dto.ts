import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  categoryName: string;

  @IsOptional()
    @IsString()
    categoryId: string;



}
