import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamDocument = Exam & Document;

@Schema()
class Venue {
  @Prop({ required: true })
  name: string;

  @Prop()
  building: string;

  @Prop()
  room: string;

  @Prop()
  capacity: number;

  @Prop()
  address: string;
}

@Schema({ timestamps: true })
export class Exam {
  @Prop({ required: true, unique: true })
  examCode: string; // Unique identifier like "CSC101-2024-S1-FINAL"

  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'ExamSchedule', required: true })
  examScheduleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop()
  courseCode: string; // Denormalized for quick access

  @Prop()
  courseName: string; // Denormalized for quick access

  @Prop({ required: true })
  examDate: Date;

  @Prop({ required: true })
  startTime: string; // e.g., "09:00"

  @Prop({ required: true })
  endTime: string; // e.g., "12:00"

  @Prop({ required: true })
  duration: number; // Duration in minutes

  @Prop({ type: Venue })
  venue: Venue;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  invigilators: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  chiefInvigilator: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'],
    default: 'SCHEDULED'
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  notes: string;

  @Prop()
  instructions: string;

  @Prop({ default: 0 })
  totalAssignedStudents: number;

  @Prop({ default: 0 })
  presentCount: number;

  @Prop({ default: 0 })
  absentCount: number;

  @Prop({ default: 30 })
  qrCodeExpiryMinutes: number;

  @Prop({ default: 15 })
  lateThresholdMinutes: number; // Minutes after start time to mark as late

  @Prop({ default: false })
  allowLateEntry: boolean;

  @Prop()
  maxLateEntryMinutes: number; // Maximum minutes late allowed for entry

  @Prop({ default: false })
  requirePhotoVerification: boolean;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

// Index for efficient querying
ExamSchema.index({ examScheduleId: 1, examDate: 1 });
ExamSchema.index({ courseId: 1 });
