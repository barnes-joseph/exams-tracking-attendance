import { IsString, IsOptional, IsMongoId, IsNumber, IsEnum, IsArray } from 'class-validator';

export class CreateEnrollmentDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  courseId: string;

  @IsString()
  academicYear: string;

  @IsEnum([1, 2])
  semester: number;

  @IsOptional()
  @IsEnum(['ENROLLED', 'DROPPED', 'COMPLETED', 'FAILED', 'WITHDRAWN'])
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsEnum(['ENROLLED', 'DROPPED', 'COMPLETED', 'FAILED', 'WITHDRAWN'])
  status?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkEnrollDto {
  @IsArray()
  @IsMongoId({ each: true })
  studentIds: string[];

  @IsMongoId()
  courseId: string;

  @IsString()
  academicYear: string;

  @IsEnum([1, 2])
  semester: number;
}

export class EnrollmentQueryDto {
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsNumber()
  semester?: number;

  @IsOptional()
  @IsEnum(['ENROLLED', 'DROPPED', 'COMPLETED', 'FAILED', 'WITHDRAWN'])
  status?: string;
}
