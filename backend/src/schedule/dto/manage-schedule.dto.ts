import { IsDateString, IsOptional } from 'class-validator';

export class CreateDoctorScheduleDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}

export class UpdateDoctorScheduleDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}
