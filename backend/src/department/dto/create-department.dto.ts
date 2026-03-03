import { IsString, IsArray, IsEmail, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  departmentName: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  emails?: string[];
}
