import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(['ADMIN', 'INVIGILATOR'])
  role: 'ADMIN' | 'INVIGILATOR';

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class StudentLoginDto {
  @IsString()
  indexNumber: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class StudentRegisterDto {
  @IsString()
  indexNumber: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  programId: string;

  @IsNumber()
  level: number;

  @IsNumber()
  enrollmentYear: number;

  @IsString()
  currentAcademicYear: string;

  @IsEnum([1, 2])
  currentSemester: number;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
