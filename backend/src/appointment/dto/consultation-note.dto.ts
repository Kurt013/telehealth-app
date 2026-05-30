import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConsultationNoteDto {
  @IsString()
  @MinLength(3)
  summary!: string;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;
}
