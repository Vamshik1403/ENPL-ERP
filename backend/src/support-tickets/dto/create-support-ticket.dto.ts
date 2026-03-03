import { IsString, IsEmail, IsInt, IsOptional, IsEnum } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsInt()
  customerId: number;

  @IsInt()
  siteId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  supportType: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  status?: string;
}