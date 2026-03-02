import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
  @Prop({ required: true, unique: true })
  indexNumber: string; // Primary identifier (renamed from studentId)

  @Prop({ required: true })
  firstName: string;

  @Prop()
  middleName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string; // Hashed password for student login

  @Prop()
  phoneNumber: string;

  @Prop()
  photo: string; // URL or path to student photo

  @Prop({ type: Types.ObjectId, ref: 'Program', required: true })
  programId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: Types.ObjectId;

  @Prop({ required: true })
  level: number; // 100, 200, 300, 400, etc.

  @Prop({ required: true })
  enrollmentYear: number; // Year of enrollment

  @Prop({ required: true })
  currentAcademicYear: string; // e.g., "2024/2025"

  @Prop({ required: true, enum: [1, 2] })
  currentSemester: number;

  @Prop({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  nationality: string;

  @Prop()
  address: string;

  @Prop()
  guardianName: string;

  @Prop()
  guardianPhone: string;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DEFERRED', 'WITHDRAWN'],
    default: 'ACTIVE'
  })
  status: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

// Index for efficient searching
StudentSchema.index({ firstName: 'text', lastName: 'text', indexNumber: 'text' });
