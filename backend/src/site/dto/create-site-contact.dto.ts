import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateSiteContactDto {
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
  @IsNotEmpty()
  emailAddress: string;
}