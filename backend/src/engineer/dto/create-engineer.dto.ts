import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateEngineerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  telegramChatId?: string;
}
