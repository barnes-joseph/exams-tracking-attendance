import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class GenerateQrCodeDto {
  @IsMongoId()
  examAssignmentId: string;

  @IsOptional()
  @IsString()
  expiryMinutes?: number;
}

export class VerifyQrCodeDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

export class ResendQrCodeDto {
  @IsMongoId()
  examAssignmentId: string;
}
