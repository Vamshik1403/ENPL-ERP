import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWorkscopeCategoryDto {
  @IsString()
  @IsNotEmpty()
  workscopeCategoryName: string;
}
