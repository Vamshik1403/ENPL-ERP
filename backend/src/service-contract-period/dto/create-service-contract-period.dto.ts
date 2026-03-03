import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceContractPeriodDto {
  @IsInt()
  serviceContractId: number;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsOptional()
  @IsString()
  nextPMVisitDate?: string;

  @IsOptional()
  @IsString()
  contractDescription?: string;
}
