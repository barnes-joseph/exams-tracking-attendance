import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProgramDocument = Program & Document;

@Schema({ timestamps: true })
export class Program {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  abbreviation: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ required: true, enum: ['UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA', 'CERTIFICATE'] })
  degreeType: string;

  @Prop({ required: true })
  duration: number; // Duration in years

  @Prop()
  description: string;

  @Prop({ default: 2 })
  semestersPerYear: number;

  @Prop()
  totalCredits: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
