import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamScheduleDocument = ExamSchedule & Document;

@Schema({ timestamps: true })
export class ExamSchedule {
  @Prop({ required: true })
  name: string; // e.g., "First Semester Examinations 2024/2025"

  @Prop({ required: true })
  academicYear: string; // e.g., "2024/2025"

  @Prop({ required: true, enum: [1, 2] })
  semester: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    required: true,
    enum: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  })
  status: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  publishedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  publishedBy: Types.ObjectId;

  @Prop({ default: false })
  qrCodesGenerated: boolean;

  @Prop()
  qrCodesGeneratedAt: Date;

  @Prop({ default: false })
  qrCodesSent: boolean;

  @Prop()
  qrCodesSentAt: Date;
}

export const ExamScheduleSchema = SchemaFactory.createForClass(ExamSchedule);
