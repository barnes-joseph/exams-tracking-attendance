import { IsString, IsOptional, IsMongoId, IsBoolean, IsEnum } from 'class-validator';

export class ScanQrDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsBoolean()
  studentVerified?: boolean;
}

export class ManualMarkDto {
  @IsMongoId()
  examId: string;

  @IsMongoId()
  studentId: string;

  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  seatNumber?: string;

  @IsOptional()
  @IsString()
  room?: string;
}

export class FlagAttendanceDto {
  @IsString()
  reason: string;
}

export class ResolveAttendanceDto {
  @IsString()
  resolution: string;

  @IsOptional()
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  newStatus?: string;
}

export class AttendanceQueryDto {
  @IsOptional()
  @IsMongoId()
  examId?: string;

  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;
}
