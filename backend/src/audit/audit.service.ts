import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

interface CreateAuditLogDto {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  studentId?: string;
  userEmail?: string;
  userRole?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  status?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(auditData: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new this.auditLogModel({
      ...auditData,
      entityId: auditData.entityId ? new Types.ObjectId(auditData.entityId) : undefined,
      userId: auditData.userId ? new Types.ObjectId(auditData.userId) : undefined,
      studentId: auditData.studentId ? new Types.ObjectId(auditData.studentId) : undefined,
    });
    return auditLog.save();
  }

  async findAll(query?: {
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const filter: any = {};

    if (query?.entityType) {
      filter.entityType = query.entityType;
    }

    if (query?.action) {
      filter.action = query.action;
    }

    if (query?.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    const limit = query?.limit || 50;
    const offset = query?.offset || 0;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({
        entityType,
        entityId: new Types.ObjectId(entityId),
      })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentActivity(limit: number = 20): Promise<AuditLog[]> {
    return this.auditLogModel
      .find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getActionCounts(startDate?: Date, endDate?: Date): Promise<{ action: string; count: number }[]> {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    return this.auditLogModel.aggregate([
      ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          action: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }
}
