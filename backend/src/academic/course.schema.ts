import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Program' })
  programId: Types.ObjectId;

  @Prop({ required: true })
  creditHours: number;

  @Prop({ required: true })
  level: number; // 100, 200, 300, 400, etc.

  @Prop({ required: true, enum: [1, 2] })
  semester: number;

  @Prop()
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Course' }] })
  prerequisites: Types.ObjectId[];

  @Prop()
  lecturer: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isElective: boolean;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
