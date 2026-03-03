import { PartialType } from '@nestjs/mapped-types';
import { CreateProductTypeDto } from './create-product.dto';

export class UpdateProductTypeDto extends PartialType(CreateProductTypeDto) {}
