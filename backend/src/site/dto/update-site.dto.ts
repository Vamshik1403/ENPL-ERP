import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateSiteDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  addressBookId?: number;

  @IsString()
  @IsOptional()
  siteName?: string;

  @IsString()
  @IsOptional()
  siteAddress?: string;

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