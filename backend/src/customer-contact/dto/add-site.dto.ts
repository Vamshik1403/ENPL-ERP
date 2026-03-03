import { IsInt } from 'class-validator';

export class AddSiteDto {
  @IsInt()
  customerId: number;

  @IsInt()
  siteId: number;
}
