import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceContractInventoryDto {
  @IsInt()
  serviceContractId: number;

  @IsInt()
  productTypeId: number;

  @IsString()
  @IsNotEmpty()
  makeModel: string;

  @IsString()
  @IsNotEmpty()
  snMac: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  purchaseDate: Date;

  @IsString()
  @IsNotEmpty()
  warrantyPeriod: string;

  @IsBoolean()
  thirdPartyPurchase: boolean;
}
