import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './attendance.schema';
import { ManualMarkDto, FlagAttendanceDto, ResolveAttendanceDto, AttendanceQueryDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
  ) {}

  async recordAttendance(
    examId: string,
    studentId: string,
    indexNumber: string,
    options: {
      examAssignmentId?: string;
      verificationMethod?: string;
      verifiedBy?: string;
      studentVerified?: boolean;
      ipAddress?: string;
      deviceInfo?: string;
      seatNumber?: string;
      room?: string;
    } = {},
  ): Promise<Attendance> {
    // Check if attendance already exists
    const existing = await this.attendanceModel.findOne({
      examId: new Types.ObjectId(examId),
      studentId: new Types.ObjectId(studentId),
    });

    if (existing) {
      throw new ConflictException('Attendance already recorded for this student');
    }

    const now = new Date();
    let status = 'PRESENT';
    let isLateEntry = false;
    let minutesLate = 0;

    // TODO: Calculate late status based on exam start time

    const attendanceData: any = {
      examId: new Types.ObjectId(examId),
      studentId: new Types.ObjectId(studentId),
      indexNumber,
      checkInTime: now,
      status,
      verificationMethod: options.verificationMethod || 'QR_SCAN',
      studentVerified: options.studentVerified || false,
      isLateEntry,
      minutesLate,
    };

    if (options.examAssignmentId) {
      attendanceData.examAssignmentId = new Types.ObjectId(options.examAssignmentId);
    }
    if (options.verifiedBy) {
      attendanceData.verifiedBy = new Types.ObjectId(options.verifiedBy);
      attendanceData.verifiedAt = now;
    }
    if (options.ipAddress) attendanceData.ipAddress = options.ipAddress;
    if (options.deviceInfo) attendanceData.deviceInfo = options.deviceInfo;
    if (options.seatNumber) attendanceData.seatNumber = options.seatNumber;
    if (options.room) attendanceData.room = options.room;

    const attendance = new this.attendanceModel(attendanceData);
    return attendance.save();
  }

  async manualMark(manualMarkDto: ManualMarkDto, recordedBy: string): Promise<Attendance> {
    const existing = await this.attendanceModel.findOne({
      examId: new Types.ObjectId(manualMarkDto.examId),
      studentId: new Types.ObjectId(manualMarkDto.studentId),
    });

    if (existing) {
      // Update existing attendance
      return this.attendanceModel
        .findByIdAndUpdate(
          existing._id,
          {
            status: manualMarkDto.status,
            verificationMethod: 'MANUAL',
            recordedBy: new Types.ObjectId(recordedBy),
            remarks: manualMarkDto.remarks,
            seatNumber: manualMarkDto.seatNumber,
            room: manualMarkDto.room,
          },
          { new: true }
        )
        .exec();
    }

    // Create new attendance
    const attendance = new this.attendanceModel({
      examId: new Types.ObjectId(manualMarkDto.examId),
      studentId: new Types.ObjectId(manualMarkDto.studentId),
      indexNumber: '', // Will be populated from student
      checkInTime: new Date(),
      status: manualMarkDto.status,
      verificationMethod: 'MANUAL',
      recordedBy: new Types.ObjectId(recordedBy),
      remarks: manualMarkDto.remarks,
      seatNumber: manualMarkDto.seatNumber,
      room: manualMarkDto.room,
    });

    return attendance.save();
  }

  async findAll(query?: AttendanceQueryDto): Promise<Attendance[]> {
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

    if (query?.isFlagged !== undefined) {
      filter.isFlagged = query.isFlagged;
    }

    return this.attendanceModel
      .find(filter)
      .populate('studentId')
      .populate('examId')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ checkInTime: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceModel
      .findById(id)
      .populate('studentId')
      .populate('examId')
      .populate('verifiedBy', 'firstName lastName')
      .exec();
    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async findByExam(examId: string): Promise<Attendance[]> {
    return this.attendanceModel
      .find({ examId: new Types.ObjectId(examId) })
      .populate('studentId')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ checkInTime: 1 })
      .exec();
  }

  async findByStudent(studentId: string): Promise<Attendance[]> {
    return this.attendanceModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('examId')
      .sort({ checkInTime: -1 })
      .exec();
  }

  async findByExamAndStudent(examId: string, studentId: string): Promise<Attendance | null> {
    return this.attendanceModel
      .findOne({
        examId: new Types.ObjectId(examId),
        studentId: new Types.ObjectId(studentId),
      })
      .populate('studentId')
      .populate('examId')
      .exec();
  }

  async flag(id: string, flagDto: FlagAttendanceDto, flaggedBy: string): Promise<Attendance> {
    const attendance = await this.attendanceModel
      .findByIdAndUpdate(
        id,
        {
          isFlagged: true,
          flagReason: flagDto.reason,
          flagStatus: 'PENDING',
          flaggedAt: new Date(),
          flaggedBy: new Types.ObjectId(flaggedBy),
        },
        { new: true }
      )
      .exec();

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async resolve(id: string, resolveDto: ResolveAttendanceDto, resolvedBy: string): Promise<Attendance> {
    const updateData: any = {
      flagStatus: 'RESOLVED',
      flagResolvedAt: new Date(),
      flagResolvedBy: new Types.ObjectId(resolvedBy),
      flagResolution: resolveDto.resolution,
    };

    if (resolveDto.newStatus) {
      updateData.status = resolveDto.newStatus;
    }

    const attendance = await this.attendanceModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async verifyStudent(id: string, verifiedBy: string): Promise<Attendance> {
    const attendance = await this.attendanceModel
      .findByIdAndUpdate(
        id,
        {
          studentVerified: true,
          verifiedBy: new Types.ObjectId(verifiedBy),
          verifiedAt: new Date(),
        },
        { new: true }
      )
      .exec();

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async updateStatus(id: string, status: string): Promise<Attendance> {
    const attendance = await this.attendanceModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async remove(id: string): Promise<void> {
    const result = await this.attendanceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
  }

  async countByExam(examId: string): Promise<{ present: number; absent: number; late: number; total: number }> {
    const result = await this.attendanceModel.aggregate([
      { $match: { examId: new Types.ObjectId(examId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    };

    result.forEach(item => {
      if (item._id === 'PRESENT') counts.present = item.count;
      else if (item._id === 'ABSENT') counts.absent = item.count;
      else if (item._id === 'LATE') counts.late = item.count;
      counts.total += item.count;
    });

    return counts;
  }

  async getFlaggedAttendance(examId?: string): Promise<Attendance[]> {
    const filter: any = { isFlagged: true, flagStatus: 'PENDING' };
    if (examId) {
      filter.examId = new Types.ObjectId(examId);
    }

    return this.attendanceModel
      .find(filter)
      .populate('studentId')
      .populate('examId')
      .populate('flaggedBy', 'firstName lastName')
      .sort({ flaggedAt: -1 })
      .exec();
  }
}
