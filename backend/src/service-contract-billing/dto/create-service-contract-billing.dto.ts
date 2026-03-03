import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServiceContractBillingDto {
  @IsInt()
  @IsNotEmpty()
  serviceContractTypeId: number;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsNotEmpty()
  paymentStatus: string;

  @IsInt()
  @IsOptional()
  overdueDays?: number;
}
