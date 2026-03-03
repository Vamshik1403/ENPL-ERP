import { IsDateString, IsInt, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateTasksScheduleDto {
  @IsInt()
  taskId: number;

  @IsDateString()
  proposedDateTime: Date;

  @IsString()
  @IsNotEmpty()
  @IsIn(['High', 'Medium', 'Low'])
  priority: string;
}
