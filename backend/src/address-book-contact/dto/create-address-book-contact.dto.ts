import { IsInt, IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateAddressBookContactDto {
  @IsInt()
  addressBookId: number;

  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @IsString()
  @IsNotEmpty()
  designation: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsEmail()
  emailAddress: string;
}
