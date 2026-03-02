import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './enrollment.schema';
import { CreateEnrollmentDto, UpdateEnrollmentDto, BulkEnrollDto, EnrollmentQueryDto } from './enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto, enrolledBy?: string): Promise<Enrollment> {
    const existing = await this.enrollmentModel.findOne({
      studentId: new Types.ObjectId(createEnrollmentDto.studentId),
      courseId: new Types.ObjectId(createEnrollmentDto.courseId),
      academicYear: createEnrollmentDto.academicYear,
      semester: createEnrollmentDto.semester,
    });

    if (existing) {
      throw new ConflictException('Student is already enrolled in this course for this semester');
    }

    const enrollment = new this.enrollmentModel({
      ...createEnrollmentDto,
      studentId: new Types.ObjectId(createEnrollmentDto.studentId),
      courseId: new Types.ObjectId(createEnrollmentDto.courseId),
      enrolledBy: enrolledBy ? new Types.ObjectId(enrolledBy) : undefined,
      enrollmentDate: new Date(),
    });

    return enrollment.save();
  }

  async bulkEnroll(bulkEnrollDto: BulkEnrollDto, enrolledBy?: string): Promise<{
    success: number;
    failed: number;
    errors: any[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const studentId of bulkEnrollDto.studentIds) {
      try {
        await this.create({
          studentId,
          courseId: bulkEnrollDto.courseId,
          academicYear: bulkEnrollDto.academicYear,
          semester: bulkEnrollDto.semester,
        }, enrolledBy);
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

  async findAll(query?: EnrollmentQueryDto): Promise<Enrollment[]> {
    const filter: any = {};

    if (query?.studentId) {
      filter.studentId = new Types.ObjectId(query.studentId);
    }

    if (query?.courseId) {
      filter.courseId = new Types.ObjectId(query.courseId);
    }

    if (query?.academicYear) {
      filter.academicYear = query.academicYear;
    }

    if (query?.semester) {
      filter.semester = query.semester;
    }

    if (query?.status) {
      filter.status = query.status;
    }

    return this.enrollmentModel
      .find(filter)
      .populate('studentId')
      .populate('courseId')
      .sort({ enrollmentDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('studentId')
      .populate('courseId')
      .exec();
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return enrollment;
  }

  async findByStudent(studentId: string, academicYear?: string, semester?: number): Promise<Enrollment[]> {
    const filter: any = { studentId: new Types.ObjectId(studentId) };
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    if (semester) {
      filter.semester = semester;
    }

    return this.enrollmentModel
      .find(filter)
      .populate('courseId')
      .sort({ academicYear: -1, semester: -1 })
      .exec();
  }

  async findByCourse(courseId: string, academicYear?: string, semester?: number): Promise<Enrollment[]> {
    const filter: any = { courseId: new Types.ObjectId(courseId), status: 'ENROLLED' };
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    if (semester) {
      filter.semester = semester;
    }

    return this.enrollmentModel
      .find(filter)
      .populate('studentId')
      .sort({ enrollmentDate: 1 })
      .exec();
  }

  async getEnrolledStudents(courseId: string, academicYear: string, semester: number): Promise<any[]> {
    const enrollments = await this.enrollmentModel
      .find({
        courseId: new Types.ObjectId(courseId),
        academicYear,
        semester,
        status: 'ENROLLED',
      })
      .populate('studentId')
      .exec();

    return enrollments.map(e => e.studentId);
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findByIdAndUpdate(id, updateEnrollmentDto, { new: true })
      .populate('studentId')
      .populate('courseId')
      .exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return enrollment;
  }

  async remove(id: string): Promise<void> {
    const result = await this.enrollmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
  }

  async dropEnrollment(id: string): Promise<Enrollment> {
    return this.update(id, { status: 'DROPPED' });
  }

  async completeEnrollment(id: string, grade: string, score?: number): Promise<Enrollment> {
    return this.update(id, { status: 'COMPLETED', grade, score });
  }

  async count(filters?: { courseId?: string; studentId?: string; academicYear?: string; semester?: number }): Promise<number> {
    const filter: any = {};
    if (filters?.courseId) {
      filter.courseId = new Types.ObjectId(filters.courseId);
    }
    if (filters?.studentId) {
      filter.studentId = new Types.ObjectId(filters.studentId);
    }
    if (filters?.academicYear) {
      filter.academicYear = filters.academicYear;
    }
    if (filters?.semester) {
      filter.semester = filters.semester;
    }
    return this.enrollmentModel.countDocuments(filter).exec();
  }

  async isStudentEnrolled(studentId: string, courseId: string, academicYear: string, semester: number): Promise<boolean> {
    const enrollment = await this.enrollmentModel.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      academicYear,
      semester,
      status: 'ENROLLED',
    });
    return !!enrollment;
  }
}
