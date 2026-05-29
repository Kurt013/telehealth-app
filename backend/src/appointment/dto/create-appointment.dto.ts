import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId!: string;

  @IsUUID()
  @IsNotEmpty()
  scheduleId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
