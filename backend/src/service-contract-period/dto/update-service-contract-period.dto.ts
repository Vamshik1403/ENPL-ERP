import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractPeriodDto } from './create-service-contract-period.dto';

export class UpdateServiceContractPeriodDto extends PartialType(CreateServiceContractPeriodDto) {}
