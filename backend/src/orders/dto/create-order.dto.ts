import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  courseId: string;

  @IsEmail()
  parentEmail: string;

  @IsEmail()
  studentEmail: string;

  // Mock payment details - never validated for real, purely cosmetic.
  @IsString()
  @Length(12, 19)
  cardNumber: string;

  @IsString()
  @Length(3, 7)
  cardExpiry: string;

  @IsString()
  @Length(3, 4)
  cardCvc: string;
}
