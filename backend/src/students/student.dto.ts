import {
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsEmail,
  IsEnum,
  IsDateString,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  indexNumber: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsMongoId()
  programId: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsNumber()
  level: number;

  @IsNumber()
  enrollmentYear: number;

  @IsString()
  currentAcademicYear: string;

  @IsEnum([1, 2])
  currentSemester: number;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DEFERRED', 'WITHDRAWN'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  indexNumber?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsMongoId()
  programId?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsNumber()
  enrollmentYear?: number;

  @IsOptional()
  @IsString()
  currentAcademicYear?: string;

  @IsOptional()
  @IsEnum([1, 2])
  currentSemester?: number;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DEFERRED', 'WITHDRAWN'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkImportStudentDto {
  @IsArray()
  students: CreateStudentDto[];
}

export class StudentQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  programId?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
