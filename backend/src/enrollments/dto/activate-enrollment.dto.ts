import { IsOptional, IsString, MinLength } from 'class-validator';

export class ActivateEnrollmentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  confirmPassword?: string;
}
