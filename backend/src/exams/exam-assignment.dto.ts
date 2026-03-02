import { IsString, IsOptional, IsEnum, IsMongoId, IsArray } from 'class-validator';

export class CreateExamAssignmentDto {
  @IsMongoId()
  examId: string;

  @IsMongoId()
  studentId: string;

  @IsOptional()
  @IsString()
  seatNumber?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateExamAssignmentDto {
  @IsOptional()
  @IsString()
  seatNumber?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsEnum(['ASSIGNED', 'CONFIRMED', 'ABSENT', 'PRESENT', 'DEFERRED'])
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAssignDto {
  @IsMongoId()
  examId: string;

  @IsArray()
  @IsMongoId({ each: true })
  studentIds: string[];

  @IsOptional()
  @IsString()
  room?: string;
}

export class AutoAssignDto {
  @IsMongoId()
  examId: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsEnum([1, 2])
  semester?: number;
}
