import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractBillingDto } from './create-service-contract-billing.dto';

export class UpdateServiceContractBillingDto extends PartialType(CreateServiceContractBillingDto) {}
