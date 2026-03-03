import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceContractDto {
  @Type(() => Number)
  @IsInt()
  customerId: number;

  @Type(() => Number)
  @IsInt()
  branchId: number;

  @IsString()
  salesManagerName: string;

  @IsOptional()
  @IsString()
  amcType?: string;
}
