import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceWorkCategoryDto } from './create-service-work-category.dto';

export class UpdateServiceWorkCategoryDto extends PartialType(CreateServiceWorkCategoryDto) {}
