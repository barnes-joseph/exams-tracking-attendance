import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Student, StudentDocument } from './student.schema';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './student.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existingByIndex = await this.studentModel.findOne({ indexNumber: createStudentDto.indexNumber });
    if (existingByIndex) {
      throw new ConflictException(`Student with index number ${createStudentDto.indexNumber} already exists`);
    }

    const existingByEmail = await this.studentModel.findOne({ email: createStudentDto.email });
    if (existingByEmail) {
      throw new ConflictException(`Student with email ${createStudentDto.email} already exists`);
    }

    const studentData: any = {
      ...createStudentDto,
      programId: new Types.ObjectId(createStudentDto.programId),
    };

    if (createStudentDto.departmentId) {
      studentData.departmentId = new Types.ObjectId(createStudentDto.departmentId);
    }

    if (createStudentDto.password) {
      studentData.password = await bcrypt.hash(createStudentDto.password, 10);
    }

    if (createStudentDto.dateOfBirth) {
      studentData.dateOfBirth = new Date(createStudentDto.dateOfBirth);
    }

    const student = new this.studentModel(studentData);
    return student.save();
  }

  async findAll(query?: StudentQueryDto): Promise<PaginatedResult<Student>> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.programId) {
      filter.programId = new Types.ObjectId(query.programId);
    }

    if (query?.departmentId) {
      filter.departmentId = new Types.ObjectId(query.departmentId);
    }

    if (query?.level) {
      filter.level = query.level;
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { indexNumber: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.studentModel
        .find(filter)
        .populate('programId')
        .populate('departmentId')
        .sort({ lastName: 1, firstName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.studentModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentModel
      .findById(id)
      .populate('programId')
      .populate('departmentId')
      .exec();
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async findByIndexNumber(indexNumber: string): Promise<Student> {
    const student = await this.studentModel
      .findOne({ indexNumber })
      .populate('programId')
      .populate('departmentId')
      .exec();
    if (!student) {
      throw new NotFoundException(`Student with index number ${indexNumber} not found`);
    }
    return student;
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.studentModel.findOne({ email }).exec();
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    if (updateStudentDto.indexNumber) {
      const existingByIndex = await this.studentModel.findOne({
        indexNumber: updateStudentDto.indexNumber,
        _id: { $ne: id },
      });
      if (existingByIndex) {
        throw new ConflictException(`Student with index number ${updateStudentDto.indexNumber} already exists`);
      }
    }

    if (updateStudentDto.email) {
      const existingByEmail = await this.studentModel.findOne({
        email: updateStudentDto.email,
        _id: { $ne: id },
      });
      if (existingByEmail) {
        throw new ConflictException(`Student with email ${updateStudentDto.email} already exists`);
      }
    }

    const updateData: any = { ...updateStudentDto };

    if (updateStudentDto.programId) {
      updateData.programId = new Types.ObjectId(updateStudentDto.programId);
    }

    if (updateStudentDto.departmentId) {
      updateData.departmentId = new Types.ObjectId(updateStudentDto.departmentId);
    }

    if (updateStudentDto.password) {
      updateData.password = await bcrypt.hash(updateStudentDto.password, 10);
    }

    if (updateStudentDto.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateStudentDto.dateOfBirth);
    }

    const student = await this.studentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('programId')
      .populate('departmentId')
      .exec();

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async updatePhoto(id: string, photoUrl: string): Promise<Student> {
    const student = await this.studentModel
      .findByIdAndUpdate(id, { photo: photoUrl }, { new: true })
      .exec();
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }

  async bulkImport(students: CreateStudentDto[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const studentDto of students) {
      try {
        await this.create(studentDto);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          indexNumber: studentDto.indexNumber,
          error: error.message,
        });
      }
    }

    return results;
  }

  async count(filters?: { programId?: string; departmentId?: string; level?: number; status?: string }): Promise<number> {
    const filter: any = {};
    if (filters?.programId) {
      filter.programId = new Types.ObjectId(filters.programId);
    }
    if (filters?.departmentId) {
      filter.departmentId = new Types.ObjectId(filters.departmentId);
    }
    if (filters?.level) {
      filter.level = filters.level;
    }
    if (filters?.status) {
      filter.status = filters.status;
    }
    return this.studentModel.countDocuments(filter).exec();
  }

  async validatePassword(student: Student, password: string): Promise<boolean> {
    if (!student.password) {
      return false;
    }
    return bcrypt.compare(password, student.password);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.studentModel.findByIdAndUpdate(id, { lastLogin: new Date() }).exec();
  }

  async findByProgram(programId: string): Promise<Student[]> {
    return this.studentModel
      .find({ programId: new Types.ObjectId(programId), isActive: true })
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async findByDepartment(departmentId: string): Promise<Student[]> {
    return this.studentModel
      .find({ departmentId: new Types.ObjectId(departmentId), isActive: true })
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async findByLevelAndSemester(
    level: number,
    semester: number,
    programId?: string,
    departmentId?: string,
  ): Promise<Student[]> {
    const filter: any = { level, currentSemester: semester, isActive: true };
    if (programId) {
      filter.programId = new Types.ObjectId(programId);
    }
    if (departmentId) {
      filter.departmentId = new Types.ObjectId(departmentId);
    }
    return this.studentModel.find(filter).sort({ lastName: 1, firstName: 1 }).exec();
  }
}
