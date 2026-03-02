import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamSchedule, ExamScheduleDocument } from './exam-schedule.schema';
import { CreateExamScheduleDto, UpdateExamScheduleDto } from './exam-schedule.dto';

@Injectable()
export class ExamScheduleService {
  constructor(
    @InjectModel(ExamSchedule.name) private examScheduleModel: Model<ExamScheduleDocument>,
  ) {}

  async create(createExamScheduleDto: CreateExamScheduleDto, userId?: string): Promise<ExamSchedule> {
    const examSchedule = new this.examScheduleModel({
      ...createExamScheduleDto,
      startDate: new Date(createExamScheduleDto.startDate),
      endDate: new Date(createExamScheduleDto.endDate),
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
    });
    return examSchedule.save();
  }

  async findAll(query?: {
    academicYear?: string;
    semester?: number;
    status?: string;
  }): Promise<ExamSchedule[]> {
    const filter: any = {};

    if (query?.academicYear) {
      filter.academicYear = query.academicYear;
    }

    if (query?.semester) {
      filter.semester = query.semester;
    }

    if (query?.status) {
      filter.status = query.status;
    }

    return this.examScheduleModel
      .find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ startDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ExamSchedule> {
    const examSchedule = await this.examScheduleModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .exec();
    if (!examSchedule) {
      throw new NotFoundException(`Exam Schedule with ID ${id} not found`);
    }
    return examSchedule;
  }

  async findCurrent(): Promise<ExamSchedule | null> {
    const now = new Date();
    return this.examScheduleModel
      .findOne({
        status: { $in: ['PUBLISHED', 'IN_PROGRESS'] },
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }

  async findUpcoming(): Promise<ExamSchedule[]> {
    const now = new Date();
    return this.examScheduleModel
      .find({
        status: 'PUBLISHED',
        startDate: { $gt: now },
      })
      .sort({ startDate: 1 })
      .limit(5)
      .exec();
  }

  async update(id: string, updateExamScheduleDto: UpdateExamScheduleDto): Promise<ExamSchedule> {
    const updateData: any = { ...updateExamScheduleDto };

    if (updateExamScheduleDto.startDate) {
      updateData.startDate = new Date(updateExamScheduleDto.startDate);
    }
    if (updateExamScheduleDto.endDate) {
      updateData.endDate = new Date(updateExamScheduleDto.endDate);
    }

    const examSchedule = await this.examScheduleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!examSchedule) {
      throw new NotFoundException(`Exam Schedule with ID ${id} not found`);
    }
    return examSchedule;
  }

  async publish(id: string, userId: string): Promise<ExamSchedule> {
    const examSchedule = await this.findOne(id);

    if (examSchedule.status !== 'DRAFT') {
      throw new BadRequestException('Only draft schedules can be published');
    }

    return this.examScheduleModel
      .findByIdAndUpdate(
        id,
        {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: new Types.ObjectId(userId),
        },
        { new: true }
      )
      .exec();
  }

  async markQrCodesGenerated(id: string): Promise<ExamSchedule> {
    return this.examScheduleModel
      .findByIdAndUpdate(
        id,
        {
          qrCodesGenerated: true,
          qrCodesGeneratedAt: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  async markQrCodesSent(id: string): Promise<ExamSchedule> {
    return this.examScheduleModel
      .findByIdAndUpdate(
        id,
        {
          qrCodesSent: true,
          qrCodesSentAt: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  async remove(id: string): Promise<void> {
    const examSchedule = await this.findOne(id);
    if (examSchedule.status !== 'DRAFT') {
      throw new BadRequestException('Only draft schedules can be deleted');
    }

    const result = await this.examScheduleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Exam Schedule with ID ${id} not found`);
    }
  }

  async count(): Promise<number> {
    return this.examScheduleModel.countDocuments().exec();
  }
}
