import { IsOptional, IsString } from 'class-validator';

export class GetSchedulesDto {
  @IsOptional()
  @IsString()
  date?: string;
}
