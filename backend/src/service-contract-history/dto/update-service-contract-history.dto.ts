import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractHistoryDto } from './create-service-contract-history.dto';

export class UpdateServiceContractHistoryDto extends PartialType(CreateServiceContractHistoryDto) {}
