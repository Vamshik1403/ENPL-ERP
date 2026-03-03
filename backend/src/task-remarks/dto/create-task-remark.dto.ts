import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateTasksRemarksDto {
  @IsInt()
  taskId: number;

  @IsString()
  @IsNotEmpty()
  remark: string;

  @IsString()
  status: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
