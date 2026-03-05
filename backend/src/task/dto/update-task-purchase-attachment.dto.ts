import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateTaskPurchaseAttachmentDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  filepath: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsOptional()
  uploadedBy?: string;
}