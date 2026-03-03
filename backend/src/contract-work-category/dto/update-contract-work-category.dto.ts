import { PartialType } from '@nestjs/mapped-types';
import { CreateContractWorkCategoryDto } from './create-contract-work-category.dto';

export class UpdateContractWorkCategoryDto extends PartialType(CreateContractWorkCategoryDto) {}
