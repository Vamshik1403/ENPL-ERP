import { IsInt, IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateTasksContactsDto {
  @IsInt()
  taskId: number;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsEmail()
  contactEmail: string;
}
