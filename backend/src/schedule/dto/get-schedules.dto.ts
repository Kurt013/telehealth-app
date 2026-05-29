import { IsOptional, IsString } from 'class-validator';

export class ScheduleRangeDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
