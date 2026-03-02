import { IsString, IsOptional, IsBoolean, IsMongoId, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsMongoId()
  departmentId: string;

  @IsEnum(['UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA', 'CERTIFICATE'])
  degreeType: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  duration: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  semestersPerYear?: number;

  @IsOptional()
  @IsNumber()
  totalCredits?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;

  @IsOptional()
  @IsEnum(['UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA', 'CERTIFICATE'])
  degreeType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  duration?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  semestersPerYear?: number;

  @IsOptional()
  @IsNumber()
  totalCredits?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
