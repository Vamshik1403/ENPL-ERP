import { IsDateString, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceContractHistoryDto {
  @IsInt()
  serviceContractId: number;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  serviceType: string; // On-Site Visit / PM Visit / Remote Support

  @IsDateString()
  serviceDate: Date;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  serviceDetails: string;
}
