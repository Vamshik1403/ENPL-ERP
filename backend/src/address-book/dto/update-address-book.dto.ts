import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressBookDto } from './create-address-book.dto';

export class UpdateAddressBookDto extends PartialType(CreateAddressBookDto) {}
