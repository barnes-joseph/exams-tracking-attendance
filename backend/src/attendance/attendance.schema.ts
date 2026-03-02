import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExamAssignment' })
  examAssignmentId: Types.ObjectId;

  @Prop({ required: true })
  indexNumber: string; // Denormalized for quick access

  @Prop({ required: true })
  checkInTime: Date;

  @Prop({
    required: true,
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    default: 'PRESENT'
  })
  status: string;

  @Prop({ default: false })
  studentVerified: boolean; // Photo verification done

  @Prop({
    enum: ['QR_SCAN', 'MANUAL', 'BIOMETRIC'],
    default: 'QR_SCAN'
  })
  verificationMethod: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId; // Invigilator who verified

  @Prop()
  verifiedAt: Date;

  @Prop({ default: false })
  isLateEntry: boolean;

  @Prop()
  minutesLate: number;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop()
  flagReason: string;

  @Prop({
    enum: ['NONE', 'PENDING', 'RESOLVED', 'ESCALATED'],
    default: 'NONE'
  })
  flagStatus: string;

  @Prop()
  flaggedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  flaggedBy: Types.ObjectId;

  @Prop()
  flagResolvedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  flagResolvedBy: Types.ObjectId;

  @Prop()
  flagResolution: string;

  @Prop()
  remarks: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy: Types.ObjectId;

  @Prop()
  ipAddress: string;

  @Prop()
  deviceInfo: string;

  @Prop()
  seatNumber: string;

  @Prop()
  room: string;

  @Prop()
  signatureImageUrl: string; // If signature capture is used

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Compound index to ensure only one attendance record per student per exam
AttendanceSchema.index({ examId: 1, studentId: 1 }, { unique: true });
AttendanceSchema.index({ examId: 1, status: 1 });
AttendanceSchema.index({ studentId: 1, checkInTime: -1 });
