import { IsOptional, IsString } from 'class-validator';

export class FindDoctorsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  symptom?: string;
}
