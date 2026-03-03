import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractTypeDto } from './create-service-contract-type.dto';

export class UpdateServiceContractTypeDto extends PartialType(CreateServiceContractTypeDto) {}
