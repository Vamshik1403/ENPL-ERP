import { IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceWorkCategoryDto {
  @IsString()
  @IsNotEmpty()
  serviceWorkCategoryName: string;
}
