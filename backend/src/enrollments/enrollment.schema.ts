import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  academicYear: string; // e.g., "2024/2025"

  @Prop({ required: true, enum: [1, 2] })
  semester: number;

  @Prop({
    required: true,
    enum: ['ENROLLED', 'DROPPED', 'COMPLETED', 'FAILED', 'WITHDRAWN'],
    default: 'ENROLLED'
  })
  status: string;

  @Prop()
  enrollmentDate: Date;

  @Prop()
  grade: string;

  @Prop()
  score: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  enrolledBy: Types.ObjectId;

  @Prop()
  remarks: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Compound index to ensure a student can only enroll once per course per academic year/semester
EnrollmentSchema.index({ studentId: 1, courseId: 1, academicYear: 1, semester: 1 }, { unique: true });
