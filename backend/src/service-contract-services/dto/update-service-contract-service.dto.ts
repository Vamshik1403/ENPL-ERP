import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractServicesDto } from './create-service-contract-service.dto';

export class UpdateServiceContractServicesDto extends PartialType(CreateServiceContractServicesDto) {}
