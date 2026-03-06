import { IsInt, IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateAddressBookContactDto {
  @IsInt()
  @IsNotEmpty()
  addressBookId: number;

  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsEmail()
  @IsOptional()
  emailAddress?: string;
}