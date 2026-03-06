import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateSiteContactDto {
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @IsString()
  @IsOptional()
  designation: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsEmail()
  @IsOptional()
  emailAddress: string;
}