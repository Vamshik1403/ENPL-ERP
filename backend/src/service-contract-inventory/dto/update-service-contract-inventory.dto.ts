import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceContractInventoryDto } from './create-service-contract-inventory.dto';

export class UpdateServiceContractInventoryDto extends PartialType(CreateServiceContractInventoryDto) {}
