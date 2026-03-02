import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamAssignmentDocument = ExamAssignment & Document;

@Schema({ timestamps: true })
export class ExamAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop()
  seatNumber: string;

  @Prop()
  room: string;

  @Prop({
    required: true,
    enum: ['ASSIGNED', 'CONFIRMED', 'ABSENT', 'PRESENT', 'DEFERRED'],
    default: 'ASSIGNED'
  })
  status: string;

  @Prop()
  qrToken: string; // JWT token for this specific assignment

  @Prop()
  qrTokenGeneratedAt: Date;

  @Prop()
  qrTokenExpiresAt: Date;

  @Prop({ default: false })
  qrEmailSent: boolean;

  @Prop()
  qrEmailSentAt: Date;

  @Prop()
  checkInTime: Date;

  @Prop()
  remarks: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedBy: Types.ObjectId;
}

export const ExamAssignmentSchema = SchemaFactory.createForClass(ExamAssignment);

// Compound index to ensure a student can only be assigned once per exam
ExamAssignmentSchema.index({ examId: 1, studentId: 1 }, { unique: true });
