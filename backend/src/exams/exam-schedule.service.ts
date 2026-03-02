import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamSchedule, ExamScheduleDocument } from './exam-schedule.schema';
import { CreateExamScheduleDto, UpdateExamScheduleDto } from './exam-schedule.dto';
import { ExamsService } from './exams.service';
import { ExamAssignmentService } from './exam-assignment.service';
import { QrCodeService } from '../qr-code/qr-code.service';

@Injectable()
export class ExamScheduleService {
  constructor(
    @InjectModel(ExamSchedule.name) private examScheduleModel: Model<ExamScheduleDocument>,
    private readonly examsService: ExamsService,
    private readonly examAssignmentService: ExamAssignmentService,
    @Inject(forwardRef(() => QrCodeService))
    private readonly qrCodeService: QrCodeService,
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

  async generateQrCodes(id: string, userId?: string): Promise<{
    success: boolean;
    generatedCount: number;
    examsProcessed: number;
    message: string;
  }> {
    const examSchedule = await this.findOne(id);
    if (!examSchedule) {
      throw new NotFoundException(`Exam Schedule with ID ${id} not found`);
    }

    // Get all exams for this schedule
    const exams = await this.examsService.findBySchedule(id);
    if (!exams || exams.length === 0) {
      throw new BadRequestException('No exams found for this schedule');
    }

    let totalGenerated = 0;
    const processedExams = new Set<string>();

    // Generate QR codes for each exam's assignments
    for (const exam of exams) {
      const examId = (exam as any)._id.toString();
      processedExams.add(examId);

      // Get all assignments for this exam
      const assignments = await this.examAssignmentService.findByExam(examId);

      for (const assignment of assignments) {
        const student = (assignment as any).studentId;
        if (!student) continue;

        const studentId = student._id.toString();
        const indexNumber = student.indexNumber;
        const examCode = exam.examCode;

        // Generate QR token using 30 minutes expiry
        const qrExpiryMinutes = exam.qrCodeExpiryMinutes || 30;

        try {
          const qrToken = await this.qrCodeService.generateToken(
            (assignment as any)._id.toString(),
            examId,
            studentId,
            indexNumber,
            examCode,
            qrExpiryMinutes,
          );

          // Update the assignment with the QR token
          await this.examAssignmentService.updateQrToken(
            (assignment as any)._id.toString(),
            qrToken.token,
            qrToken.expiresAt,
          );

          totalGenerated++;
        } catch (error) {
          // Log error but continue with other assignments
          console.error(`Failed to generate QR code for assignment ${(assignment as any)._id}:`, error.message);
        }
      }
    }

    // Mark schedule as having QR codes generated
    await this.markQrCodesGenerated(id);

    return {
      success: true,
      generatedCount: totalGenerated,
      examsProcessed: processedExams.size,
      message: `Successfully generated ${totalGenerated} QR codes for ${processedExams.size} exams`,
    };
  }

  async sendQrCodes(id: string, userId?: string): Promise<{
    success: boolean;
    generatedCount: number;
    sentCount: number;
    isResend: boolean;
    message: string;
  }> {
    const examSchedule = await this.findOne(id);
    if (!examSchedule) {
      throw new NotFoundException(`Exam Schedule with ID ${id} not found`);
    }

    // Get all exams for this schedule
    const exams = await this.examsService.findBySchedule(id);
    if (!exams || exams.length === 0) {
      throw new BadRequestException('No exams found for this schedule');
    }

    // Check if this is a resend
    const isResend = examSchedule.qrCodesSent === true;

    let totalGenerated = 0;
    let totalSent = 0;

    // Generate QR codes for any missing assignments and collect all for sending
    for (const exam of exams) {
      const examId = (exam as any)._id.toString();

      // Get all assignments for this exam
      const assignments = await this.examAssignmentService.findByExam(examId);

      for (const assignment of assignments) {
        const assignmentId = (assignment as any)._id.toString();
        const student = (assignment as any).studentId;
        if (!student) continue;

        const studentId = student._id.toString();
        const indexNumber = student.indexNumber;
        const examCode = exam.examCode;

        // Check if assignment already has a QR token
        let hasQrToken = !!(assignment as any).qrToken;

        // If no QR token exists, generate one
        if (!hasQrToken) {
          try {
            const qrExpiryMinutes = exam.qrCodeExpiryMinutes || 30;
            const qrToken = await this.qrCodeService.generateToken(
              assignmentId,
              examId,
              studentId,
              indexNumber,
              examCode,
              qrExpiryMinutes,
            );

            // Update the assignment with the QR token
            await this.examAssignmentService.updateQrToken(
              assignmentId,
              qrToken.token,
              qrToken.expiresAt,
            );

            totalGenerated++;
            hasQrToken = true;
          } catch (error) {
            console.error(`Failed to generate QR code for assignment ${assignmentId}:`, error.message);
            continue;
          }
        }

        // Count as sent if we have a QR token (either existing or newly generated)
        if (hasQrToken) {
          totalSent++;
          // TODO: Send email notification here
          // await this.sendQrCodeEmail(student.email, qrToken);
        }
      }
    }

    // Mark schedule as having QR codes generated (if any were generated)
    if (totalGenerated > 0 || !examSchedule.qrCodesGenerated) {
      await this.markQrCodesGenerated(id);
    }

    // Always update the sent timestamp (allows resending)
    await this.examScheduleModel.findByIdAndUpdate(
      id,
      {
        qrCodesSent: true,
        qrCodesSentAt: new Date(),
      },
      { new: true }
    );

    return {
      success: true,
      generatedCount: totalGenerated,
      sentCount: totalSent,
      isResend,
      message: isResend
        ? `Resent QR codes to ${totalSent} students${totalGenerated > 0 ? ` (generated ${totalGenerated} new)` : ''}`
        : totalGenerated > 0
          ? `Generated ${totalGenerated} new QR codes and sent ${totalSent} total QR codes`
          : `Sent ${totalSent} QR codes`,
    };
  }
}
