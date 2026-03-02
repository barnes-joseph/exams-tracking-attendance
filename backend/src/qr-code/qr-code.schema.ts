import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QRCodeTokenDocument = QRCodeToken & Document;

@Schema({ timestamps: true })
export class QRCodeToken {
  @Prop({ type: Types.ObjectId, ref: 'ExamAssignment', required: true })
  examAssignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  indexNumber: string; // Student's index number for quick reference

  @Prop({ required: true })
  examCode: string; // Exam code for quick reference

  @Prop({ required: true, unique: true })
  token: string; // JWT token

  @Prop({ required: true })
  generatedAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop()
  usedAt: Date;

  @Prop()
  scanCount: number; // Track number of scan attempts

  @Prop()
  lastScanAt: Date;

  @Prop()
  ipAddress: string;

  @Prop()
  deviceInfo: string;

  @Prop()
  scannedByUserId: Types.ObjectId;

  @Prop({ default: false })
  emailSent: boolean;

  @Prop()
  emailSentAt: Date;

  @Prop({
    enum: ['ACTIVE', 'USED', 'EXPIRED', 'REVOKED'],
    default: 'ACTIVE'
  })
  status: string;

  @Prop()
  revokedAt: Date;

  @Prop()
  revokedReason: string;
}

export const QRCodeTokenSchema = SchemaFactory.createForClass(QRCodeToken);

// Keep the old export name for backward compatibility
export { QRCodeToken as QRCode, QRCodeTokenDocument as QRCodeDocument };
export { QRCodeTokenSchema as QRCodeSchema };

// Indexes
QRCodeTokenSchema.index({ examId: 1, studentId: 1 });
QRCodeTokenSchema.index({ token: 1 }, { unique: true });
QRCodeTokenSchema.index({ examAssignmentId: 1 });
