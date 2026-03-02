import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SCAN_QR', etc.

  @Prop({ required: true })
  entityType: string; // e.g., 'Student', 'Exam', 'Attendance', 'User', etc.

  @Prop({ type: Types.ObjectId })
  entityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student' })
  studentId: Types.ObjectId;

  @Prop()
  userEmail: string;

  @Prop()
  userRole: string;

  @Prop({ type: Object })
  previousData: Record<string, any>;

  @Prop({ type: Object })
  newData: Record<string, any>;

  @Prop({ type: Object })
  changes: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  description: string;

  @Prop({
    required: true,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS'
  })
  status: string;

  @Prop()
  errorMessage: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Index for efficient querying
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
