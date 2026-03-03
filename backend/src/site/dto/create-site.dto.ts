import { IsString, IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateSiteDto {
  @IsInt()
  @Min(1)
  addressBookId: number;

  @IsString()
  @IsNotEmpty()
  siteName: string;

  @IsString()
  @IsNotEmpty()
  siteAddress: string;

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