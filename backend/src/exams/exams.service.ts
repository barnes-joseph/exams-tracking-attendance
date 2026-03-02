import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from './exam.schema';
import { CreateExamDto, UpdateExamDto, ExamQueryDto } from './exam.dto';
import { ExamAssignment, ExamAssignmentDocument } from './exam-assignment.schema';
import { Attendance, AttendanceDocument } from '../attendance/attendance.schema';
import { Enrollment, EnrollmentDocument } from '../enrollments/enrollment.schema';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(ExamAssignment.name) private examAssignmentModel: Model<ExamAssignmentDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async create(createExamDto: CreateExamDto, userId: string): Promise<Exam> {
    const existingExam = await this.examModel.findOne({ examCode: createExamDto.examCode });
    if (existingExam) {
      throw new ConflictException(`Exam with code ${createExamDto.examCode} already exists`);
    }

    const examData: any = {
      ...createExamDto,
      examScheduleId: new Types.ObjectId(createExamDto.examScheduleId),
      courseId: new Types.ObjectId(createExamDto.courseId),
      examDate: new Date(createExamDto.examDate),
      createdBy: new Types.ObjectId(userId),
    };

    if (createExamDto.invigilators?.length) {
      examData.invigilators = createExamDto.invigilators.map(id => new Types.ObjectId(id));
    }

    if (createExamDto.chiefInvigilator) {
      examData.chiefInvigilator = new Types.ObjectId(createExamDto.chiefInvigilator);
    }

    const exam = new this.examModel(examData);
    return exam.save();
  }

  async findAll(query?: ExamQueryDto): Promise<Exam[]> {
    const filter: any = {};

    if (query?.examScheduleId) {
      filter.examScheduleId = new Types.ObjectId(query.examScheduleId);
    }

    if (query?.courseId) {
      filter.courseId = new Types.ObjectId(query.courseId);
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.invigilatorId) {
      filter.invigilators = new Types.ObjectId(query.invigilatorId);
    }

    if (query?.date) {
      const date = new Date(query.date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.examDate = { $gte: startOfDay, $lte: endOfDay };
    }

    return this.examModel
      .find(filter)
      .populate('examScheduleId')
      .populate('courseId')
      .populate('invigilators', 'firstName lastName email')
      .populate('chiefInvigilator', 'firstName lastName email')
      .sort({ examDate: 1, startTime: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examModel
      .findById(id)
      .populate('examScheduleId')
      .populate('courseId')
      .populate('invigilators', 'firstName lastName email')
      .populate('chiefInvigilator', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .exec();
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return exam;
  }

  async findByCode(examCode: string): Promise<Exam> {
    const exam = await this.examModel
      .findOne({ examCode })
      .populate('examScheduleId')
      .populate('courseId')
      .exec();
    if (!exam) {
      throw new NotFoundException(`Exam with code ${examCode} not found`);
    }
    return exam;
  }

  async findByDate(date: Date): Promise<Exam[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.examModel
      .find({
        examDate: { $gte: startOfDay, $lte: endOfDay },
      })
      .populate('courseId')
      .populate('invigilators', 'firstName lastName')
      .sort({ startTime: 1 })
      .exec();
  }

  async findByInvigilator(invigilatorId: string, date?: Date): Promise<Exam[]> {
    const filter: any = {
      invigilators: new Types.ObjectId(invigilatorId),
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.examDate = { $gte: startOfDay, $lte: endOfDay };
    }

    return this.examModel
      .find(filter)
      .populate('courseId')
      .sort({ examDate: 1, startTime: 1 })
      .exec();
  }

  async findTodaysExams(): Promise<Exam[]> {
    return this.findByDate(new Date());
  }

  async findBySchedule(examScheduleId: string): Promise<Exam[]> {
    return this.examModel
      .find({ examScheduleId: new Types.ObjectId(examScheduleId) })
      .populate('courseId')
      .populate('invigilators', 'firstName lastName')
      .sort({ examDate: 1, startTime: 1 })
      .exec();
  }

  async update(id: string, updateExamDto: UpdateExamDto): Promise<Exam> {
    if (updateExamDto.examCode) {
      const existingExam = await this.examModel.findOne({
        examCode: updateExamDto.examCode,
        _id: { $ne: id },
      });
      if (existingExam) {
        throw new ConflictException(`Exam with code ${updateExamDto.examCode} already exists`);
      }
    }

    const updateData: any = { ...updateExamDto };

    if (updateExamDto.examScheduleId) {
      updateData.examScheduleId = new Types.ObjectId(updateExamDto.examScheduleId);
    }
    if (updateExamDto.courseId) {
      updateData.courseId = new Types.ObjectId(updateExamDto.courseId);
    }
    if (updateExamDto.examDate) {
      updateData.examDate = new Date(updateExamDto.examDate);
    }
    if (updateExamDto.invigilators?.length) {
      updateData.invigilators = updateExamDto.invigilators.map(id => new Types.ObjectId(id));
    }
    if (updateExamDto.chiefInvigilator) {
      updateData.chiefInvigilator = new Types.ObjectId(updateExamDto.chiefInvigilator);
    }

    const exam = await this.examModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('examScheduleId')
      .populate('courseId')
      .exec();

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return exam;
  }

  async updateStatus(id: string, status: string): Promise<Exam> {
    return this.update(id, { status });
  }

  async updateAttendanceCounts(id: string, presentCount: number, absentCount: number): Promise<Exam> {
    return this.examModel
      .findByIdAndUpdate(id, { presentCount, absentCount }, { new: true })
      .exec();
  }

  async addInvigilator(id: string, invigilatorId: string): Promise<Exam> {
    const exam = await this.examModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { invigilators: new Types.ObjectId(invigilatorId) } },
        { new: true }
      )
      .exec();
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return exam;
  }

  async removeInvigilator(id: string, invigilatorId: string): Promise<Exam> {
    const exam = await this.examModel
      .findByIdAndUpdate(
        id,
        { $pull: { invigilators: new Types.ObjectId(invigilatorId) } },
        { new: true }
      )
      .exec();
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return exam;
  }

  async remove(id: string): Promise<void> {
    const result = await this.examModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
  }

  async count(examScheduleId?: string): Promise<number> {
    const filter: any = {};
    if (examScheduleId) {
      filter.examScheduleId = new Types.ObjectId(examScheduleId);
    }
    return this.examModel.countDocuments(filter).exec();
  }

  async findByInvigilatorWithFilters(
    invigilatorId: string,
    filters: { status?: string; period?: string },
  ): Promise<Exam[]> {
    const query: any = {
      invigilators: new Types.ObjectId(invigilatorId),
    };

    if (filters.status) {
      query.status = filters.status;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filters.period === 'upcoming') {
      query.examDate = { $gte: today };
    } else if (filters.period === 'past') {
      query.examDate = { $lt: today };
    }

    return this.examModel
      .find(query)
      .populate('courseId')
      .populate('examScheduleId')
      .sort({ examDate: filters.period === 'past' ? -1 : 1, startTime: 1 })
      .exec();
  }

  async findExamAssignments(examId: string) {
    return this.examAssignmentModel
      .find({ examId: new Types.ObjectId(examId) })
      .populate('studentId')
      .sort({ seatNumber: 1 })
      .exec();
  }

  async findExamAttendance(examId: string) {
    return this.attendanceModel
      .find({ examId: new Types.ObjectId(examId) })
      .populate('studentId')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ checkInTime: 1 })
      .exec();
  }

  async autoAssignStudents(examId: string) {
    const exam = await this.findOne(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Get the course for this exam
    const courseId = typeof exam.courseId === 'string'
      ? exam.courseId
      : (exam.courseId as any)._id;

    // Get exam schedule to determine academic year and semester
    const examSchedule = typeof exam.examScheduleId === 'string'
      ? await this.examModel.findById(exam.examScheduleId).exec()
      : exam.examScheduleId;

    // Find all enrolled students for this course
    const enrollments = await this.enrollmentModel
      .find({
        courseId: new Types.ObjectId(courseId),
        status: 'ENROLLED',
      })
      .exec();

    // Create exam assignments for each enrolled student
    const assignments = [];
    let seatNumber = 1;

    for (const enrollment of enrollments) {
      // Check if assignment already exists
      const existingAssignment = await this.examAssignmentModel.findOne({
        examId: new Types.ObjectId(examId),
        studentId: enrollment.studentId,
      });

      if (!existingAssignment) {
        const assignment = new this.examAssignmentModel({
          examId: new Types.ObjectId(examId),
          studentId: enrollment.studentId,
          seatNumber: seatNumber.toString().padStart(3, '0'),
          status: 'ASSIGNED',
        });
        await assignment.save();
        assignments.push(assignment);
        seatNumber++;
      }
    }

    // Update exam with total assigned students count
    await this.examModel.findByIdAndUpdate(examId, {
      totalAssignedStudents: await this.examAssignmentModel.countDocuments({
        examId: new Types.ObjectId(examId),
      }),
    });

    return {
      assigned: assignments.length,
      total: enrollments.length,
    };
  }
}
