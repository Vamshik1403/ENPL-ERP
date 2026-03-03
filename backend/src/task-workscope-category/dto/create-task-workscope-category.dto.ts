import { IsInt } from 'class-validator';

export class CreateTasksWorkscopeCategoryDto {
  @IsInt()
  taskId: number;

  @IsInt()
  workscopeCategoryId: number;
}
