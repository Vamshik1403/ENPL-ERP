import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateSiteContactDto {
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsEmail()
  @IsOptional()
  emailAddress?: string;
}