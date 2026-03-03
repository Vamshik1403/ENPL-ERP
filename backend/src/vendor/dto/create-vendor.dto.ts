import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateVendorContactDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  contactPhoneNumber: string;

  @IsNotEmpty()
  @IsEmail()
  contactEmailId: string;

  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsNotEmpty()
  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  landlineNumber?: string;
}

class CreateBankDetailDto {
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  ifscCode: string;

  @IsNotEmpty()
  @IsString()
  branchName: string;

}

export class CreateVendorDto {

  @IsNotEmpty()
  @IsString()
  vendorCode :string;

  @IsNotEmpty()
  @IsString()
  vendorName: string;

  @IsNotEmpty()
  @IsString()
  registerAddress: string;

  @IsNotEmpty()
  @IsString()
  gstNo: string;

  @IsNotEmpty()
  @IsString()
  businessType: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsEmail()
  emailId: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsObject()
  products?: any;

  @IsNotEmpty()
  @IsString()
  creditTerms: string;

  @IsNotEmpty()
  @IsString()
  creditLimit: string;

  @IsNotEmpty()
  @IsString()
  remark: string;
  
  @IsOptional()
  @IsString()
  gstpdf?: string; // this will store the file path or filename
  

  @IsOptional()
  @IsInt()
  hodId?: number;

  @IsOptional()
  @IsInt()
  managerId?: number;

  @IsOptional()
  @IsInt()
  executiveId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorContactDto)
  contacts: CreateVendorContactDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBankDetailDto)
  bankDetails: CreateBankDetailDto[];
}
