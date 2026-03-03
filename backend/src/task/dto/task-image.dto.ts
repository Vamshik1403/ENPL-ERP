import { IsString, IsOptional } from 'class-validator';

export class TaskImageDto {
  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  filepath?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsOptional()
  fileSize?: number;
}