import { IsInt, IsObject } from 'class-validator';

export class UpdateUserPermissionDto {
  @IsInt()
  userId: number;

  @IsObject()
  permissions: Record<
    string,
    {
      read?: boolean;
      create?: boolean;
      edit?: boolean;
      delete?: boolean;
    }
  >;
}
