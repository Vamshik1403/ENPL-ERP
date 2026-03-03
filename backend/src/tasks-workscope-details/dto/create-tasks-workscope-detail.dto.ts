import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTasksWorkscopeDetailsDto {
  @IsInt()
  taskId: number;

  @IsInt()
  @IsNotEmpty()
  workscopeCategoryId: number;

  @IsString()
  @IsNotEmpty()
  workscopeDetails: string;

  @IsString()
  @IsOptional()
  extraNote?: string;
}
