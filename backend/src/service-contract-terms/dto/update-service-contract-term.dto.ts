import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractTermsDto } from './create-service-contract-term.dto';

export class UpdateServiceContractTermsDto extends PartialType(CreateServiceContractTermsDto) {}
