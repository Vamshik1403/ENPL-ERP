import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressBookContactDto } from './create-address-book-contact.dto';

export class UpdateAddressBookContactDto extends PartialType(CreateAddressBookContactDto) {}
