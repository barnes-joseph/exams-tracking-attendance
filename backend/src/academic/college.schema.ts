import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollegeDocument = College & Document;

@Schema({ timestamps: true })
export class College {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  dean: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CollegeSchema = SchemaFactory.createForClass(College);
