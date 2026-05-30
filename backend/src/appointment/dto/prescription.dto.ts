import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class PrescriptionDto {
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  medications!: string[];
}
