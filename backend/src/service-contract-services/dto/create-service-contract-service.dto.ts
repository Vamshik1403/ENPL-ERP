import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateServiceContractServicesDto {
  @IsInt()
  @IsNotEmpty()
  serviceContractId: number;

  @IsInt()
  @IsNotEmpty()
  contractWorkCategoryId: number;

  @IsNotEmpty()
  description?: string; // Add this line
}
