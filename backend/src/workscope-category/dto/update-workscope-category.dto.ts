import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkscopeCategoryDto } from './create-workscope-category.dto';

export class UpdateWorkscopeCategoryDto extends PartialType(CreateWorkscopeCategoryDto) {}
