import { IsString, IsOptional, IsBoolean, IsMongoId, IsNumber, IsArray, Min, Max, IsEnum } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsMongoId()
  departmentId: string;

  @IsOptional()
  @IsMongoId()
  programId?: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  creditHours: number;

  @IsNumber()
  level: number; // 100, 200, 300, 400, etc.

  @IsEnum([1, 2])
  semester: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  prerequisites?: string[];

  @IsOptional()
  @IsString()
  lecturer?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isElective?: boolean;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsMongoId()
  programId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  creditHours?: number;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsEnum([1, 2])
  semester?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  prerequisites?: string[];

  @IsOptional()
  @IsString()
  lecturer?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isElective?: boolean;
}
