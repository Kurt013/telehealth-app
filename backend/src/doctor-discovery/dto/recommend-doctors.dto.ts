import { IsString, MinLength } from 'class-validator';

export class RecommendDoctorsDto {
  @IsString()
  @MinLength(3)
  text!: string;
}