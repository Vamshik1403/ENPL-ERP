import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceContractTermsDto {
  @IsInt()
  serviceContractId: number;

  @IsString()
  @IsNotEmpty()
  maxOnSiteVisits: string;

  @IsString()
  @IsNotEmpty()
  maxPreventiveMaintenanceVisit: string;

  @IsBoolean()
  inclusiveInOnSiteVisitCounts: boolean;

  @IsString()
  @IsNotEmpty()
  preventiveMaintenanceCycle: string;
}
