import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateServiceContractTypeDto {
  @IsString()
  @IsNotEmpty()
  serviceContractType: string;

  @IsInt()
  @IsNotEmpty()
  serviceContractId: number;

  @IsString()
  @IsNotEmpty()
  billingType: string;

  @IsString()
  @IsNotEmpty()
  billingCycle: string;

  @IsString()
  @IsNotEmpty()
  billingDueDate: string;

  @IsString()
  @IsNotEmpty()
  paymentStatus: string;
}
