import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContractWorkCategoryDto {
  @IsString()
  @IsNotEmpty()
  contractWorkCategoryName: string;
}
