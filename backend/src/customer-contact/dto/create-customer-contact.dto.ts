import { IsArray, IsEmail, IsInt, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContactSiteDto {
  @IsInt()
  customerId: number;

  @IsInt()
  siteId: number;
}

export class CreateCustomerContactDto {
  @IsString()
  @MinLength(1)
  custFirstName: string;

  @IsString()
  @MinLength(1)
  custLastName: string;

  @IsString()
  @MinLength(6)
  phoneNumber: string;

  @IsEmail()
  emailAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactSiteDto)
  sites: ContactSiteDto[];
}
