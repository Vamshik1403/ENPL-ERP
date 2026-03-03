import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class SaveBackupConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsIn(['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'])
  type: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(59)
  minute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number; // 0=Sunday

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsInt()
  @Min(1)
  @Max(200) // UI max, you can increase
  maxFiles: number;
}

export class RestoreByNameDto {
  @IsIn(['enplerp']) // keep strict; or remove and validate server-side
  db?: string;

  filename: string;
}
