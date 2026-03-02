import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamAssignment, ExamAssignmentDocument } from './exam-assignment.schema';
import { CreateExamAssignmentDto, UpdateExamAssignmentDto, BulkAssignDto } from './exam-assignment.dto';

@Injectable()
export class ExamAssignmentService {
  constructor(
    @InjectModel(ExamAssignment.name) private examAssignmentModel: Model<ExamAssignmentDocument>,
  ) {}

  async create(createExamAssignmentDto: CreateExamAssignmentDto, assignedBy?: string): Promise<ExamAssignment> {
    const existing = await this.examAssignmentModel.findOne({
      examId: new Types.ObjectId(createExamAssignmentDto.examId),
      studentId: new Types.ObjectId(createExamAssignmentDto.studentId),
    });

    if (existing) {
      throw new ConflictException('Student is already assigned to this exam');
    }

    const assignment = new this.examAssignmentModel({
      ...createExamAssignmentDto,
      examId: new Types.ObjectId(createExamAssignmentDto.examId),
      studentId: new Types.ObjectId(createExamAssignmentDto.studentId),
      assignedBy: assignedBy ? new Types.ObjectId(assignedBy) : undefined,
    });

    return assignment.save();
  }

  async bulkAssign(bulkAssignDto: BulkAssignDto, assignedBy?: string): Promise<{
    success: number;
    failed: number;
    errors: any[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const studentId of bulkAssignDto.studentIds) {
      try {
        await this.create({
          examId: bulkAssignDto.examId,
          studentId,
          room: bulkAssignDto.room,
        }, assignedBy);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          studentId,
          error: error.message,
        });
      }
    }

    return results;
  }

  async findAll(query?: {
    examId?: string;
    studentId?: string;
    status?: string;
  }): Promise<ExamAssignment[]> {
    const filter: any = {};

    if (query?.examId) {
      filter.examId = new Types.ObjectId(query.examId);
    }

    if (query?.studentId) {
      filter.studentId = new Types.ObjectId(query.studentId);
    }

    if (query?.status) {
      filter.status = query.status;
    }

    return this.examAssignmentModel
      .find(filter)
      .populate('examId')
      .populate('studentId')
      .sort({ seatNumber: 1 })
      .exec();
  }

  async findOne(id: string): Promise<ExamAssignment> {
    const assignment = await this.examAssignmentModel
      .findById(id)
      .populate('examId')
      .populate('studentId')
      .exec();
    if (!assignment) {
      throw new NotFoundException(`Exam Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async findByExam(examId: string): Promise<ExamAssignment[]> {
    return this.examAssignmentModel
      .find({ examId: new Types.ObjectId(examId) })
      .populate('studentId')
      .sort({ seatNumber: 1 })
      .exec();
  }

  async findByStudent(studentId: string): Promise<ExamAssignment[]> {
    return this.examAssignmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('examId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByExamAndStudent(examId: string, studentId: string): Promise<ExamAssignment | null> {
    return this.examAssignmentModel
      .findOne({
        examId: new Types.ObjectId(examId),
        studentId: new Types.ObjectId(studentId),
      })
      .populate('examId')
      .populate('studentId')
      .exec();
  }

  async update(id: string, updateExamAssignmentDto: UpdateExamAssignmentDto): Promise<ExamAssignment> {
    const assignment = await this.examAssignmentModel
      .findByIdAndUpdate(id, updateExamAssignmentDto, { new: true })
      .populate('examId')
      .populate('studentId')
      .exec();

    if (!assignment) {
      throw new NotFoundException(`Exam Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async updateStatus(id: string, status: string): Promise<ExamAssignment> {
    return this.update(id, { status });
  }

  async updateQrToken(id: string, token: string, expiresAt: Date): Promise<ExamAssignment> {
    const assignment = await this.examAssignmentModel
      .findByIdAndUpdate(
        id,
        {
          qrToken: token,
          qrTokenGeneratedAt: new Date(),
          qrTokenExpiresAt: expiresAt,
        },
        { new: true }
      )
      .exec();

    if (!assignment) {
      throw new NotFoundException(`Exam Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async markQrEmailSent(id: string): Promise<ExamAssignment> {
    return this.examAssignmentModel
      .findByIdAndUpdate(
        id,
        {
          qrEmailSent: true,
          qrEmailSentAt: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  async markCheckIn(id: string): Promise<ExamAssignment> {
    return this.examAssignmentModel
      .findByIdAndUpdate(
        id,
        {
          status: 'PRESENT',
          checkInTime: new Date(),
        },
        { new: true }
      )
      .exec();
  }

  async remove(id: string): Promise<void> {
    const result = await this.examAssignmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Exam Assignment with ID ${id} not found`);
    }
  }

  async removeByExam(examId: string): Promise<void> {
    await this.examAssignmentModel
      .deleteMany({ examId: new Types.ObjectId(examId) })
      .exec();
  }

  async count(examId?: string): Promise<number> {
    const filter: any = {};
    if (examId) {
      filter.examId = new Types.ObjectId(examId);
    }
    return this.examAssignmentModel.countDocuments(filter).exec();
  }

  async countByStatus(examId: string): Promise<{ [key: string]: number }> {
    const result = await this.examAssignmentModel.aggregate([
      { $match: { examId: new Types.ObjectId(examId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }
}
