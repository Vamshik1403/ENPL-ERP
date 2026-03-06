import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressBookDto {
  @IsString()
  @IsOptional()
  addressType?: string;

  @IsString()
  @IsOptional()
  addressBookID?: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  regdAddress: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pinCode?: string;

  @IsString()
  @IsOptional()
  gstNo?: string;
}