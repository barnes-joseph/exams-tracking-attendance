import { IsString, IsDateString, IsOptional, IsArray, IsNumber, IsEnum, IsMongoId, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VenueDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateExamDto {
  @IsString()
  examCode: string;

  @IsString()
  title: string;

  @IsMongoId()
  examScheduleId: string;

  @IsMongoId()
  courseId: string;

  @IsOptional()
  @IsString()
  courseCode?: string;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsDateString()
  examDate: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsNumber()
  duration: number;

  @ValidateNested()
  @Type(() => VenueDto)
  venue: VenueDto;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  invigilators?: string[];

  @IsOptional()
  @IsMongoId()
  chiefInvigilator?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  qrCodeExpiryMinutes?: number;

  @IsOptional()
  @IsNumber()
  lateThresholdMinutes?: number;

  @IsOptional()
  @IsBoolean()
  allowLateEntry?: boolean;

  @IsOptional()
  @IsNumber()
  maxLateEntryMinutes?: number;

  @IsOptional()
  @IsBoolean()
  requirePhotoVerification?: boolean;
}

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  examCode?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsMongoId()
  examScheduleId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsString()
  courseCode?: string;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VenueDto)
  venue?: VenueDto;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  invigilators?: string[];

  @IsOptional()
  @IsMongoId()
  chiefInvigilator?: string;

  @IsOptional()
  @IsEnum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  qrCodeExpiryMinutes?: number;

  @IsOptional()
  @IsNumber()
  lateThresholdMinutes?: number;

  @IsOptional()
  @IsBoolean()
  allowLateEntry?: boolean;

  @IsOptional()
  @IsNumber()
  maxLateEntryMinutes?: number;

  @IsOptional()
  @IsBoolean()
  requirePhotoVerification?: boolean;
}

export class ExamQueryDto {
  @IsOptional()
  @IsMongoId()
  examScheduleId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsMongoId()
  invigilatorId?: string;
}
