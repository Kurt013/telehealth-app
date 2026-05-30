import { IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  scheduleId!: string;
}
