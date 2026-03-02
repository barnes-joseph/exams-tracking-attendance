import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { CreateCourseDto, UpdateCourseDto } from './course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const existingCourse = await this.courseModel.findOne({ code: createCourseDto.code });
    if (existingCourse) {
      throw new ConflictException(`Course with code ${createCourseDto.code} already exists`);
    }

    const courseData: any = {
      ...createCourseDto,
      departmentId: new Types.ObjectId(createCourseDto.departmentId),
    };

    if (createCourseDto.programId) {
      courseData.programId = new Types.ObjectId(createCourseDto.programId);
    }

    if (createCourseDto.prerequisites?.length) {
      courseData.prerequisites = createCourseDto.prerequisites.map(id => new Types.ObjectId(id));
    }

    const course = new this.courseModel(courseData);
    return course.save();
  }

  async findAll(query?: {
    isActive?: boolean;
    departmentId?: string;
    programId?: string;
    level?: number;
    semester?: number;
    isElective?: boolean;
    search?: string;
  }): Promise<Course[]> {
    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.departmentId) {
      filter.departmentId = new Types.ObjectId(query.departmentId);
    }

    if (query?.programId) {
      filter.programId = new Types.ObjectId(query.programId);
    }

    if (query?.level) {
      filter.level = query.level;
    }

    if (query?.semester) {
      filter.semester = query.semester;
    }

    if (query?.isElective !== undefined) {
      filter.isElective = query.isElective;
    }

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { lecturer: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.courseModel
      .find(filter)
      .populate('departmentId')
      .populate('programId')
      .populate('prerequisites')
      .sort({ code: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate('departmentId')
      .populate('programId')
      .populate('prerequisites')
      .exec();
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async findByCode(code: string): Promise<Course> {
    const course = await this.courseModel
      .findOne({ code })
      .populate('departmentId')
      .populate('programId')
      .populate('prerequisites')
      .exec();
    if (!course) {
      throw new NotFoundException(`Course with code ${code} not found`);
    }
    return course;
  }

  async findByDepartment(departmentId: string): Promise<Course[]> {
    return this.courseModel
      .find({ departmentId: new Types.ObjectId(departmentId) })
      .populate('programId')
      .sort({ code: 1 })
      .exec();
  }

  async findByProgram(programId: string): Promise<Course[]> {
    return this.courseModel
      .find({ programId: new Types.ObjectId(programId) })
      .sort({ level: 1, semester: 1, code: 1 })
      .exec();
  }

  async findByLevelAndSemester(level: number, semester: number, departmentId?: string): Promise<Course[]> {
    const filter: any = { level, semester };
    if (departmentId) {
      filter.departmentId = new Types.ObjectId(departmentId);
    }
    return this.courseModel
      .find(filter)
      .populate('departmentId')
      .sort({ code: 1 })
      .exec();
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    if (updateCourseDto.code) {
      const existingCourse = await this.courseModel.findOne({
        code: updateCourseDto.code,
        _id: { $ne: id },
      });
      if (existingCourse) {
        throw new ConflictException(`Course with code ${updateCourseDto.code} already exists`);
      }
    }

    const updateData: any = { ...updateCourseDto };
    if (updateCourseDto.departmentId) {
      updateData.departmentId = new Types.ObjectId(updateCourseDto.departmentId);
    }
    if (updateCourseDto.programId) {
      updateData.programId = new Types.ObjectId(updateCourseDto.programId);
    }
    if (updateCourseDto.prerequisites?.length) {
      updateData.prerequisites = updateCourseDto.prerequisites.map(id => new Types.ObjectId(id));
    }

    const course = await this.courseModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('departmentId')
      .populate('programId')
      .populate('prerequisites')
      .exec();
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async remove(id: string): Promise<void> {
    const result = await this.courseModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
  }

  async count(filters?: { departmentId?: string; programId?: string }): Promise<number> {
    const filter: any = {};
    if (filters?.departmentId) {
      filter.departmentId = new Types.ObjectId(filters.departmentId);
    }
    if (filters?.programId) {
      filter.programId = new Types.ObjectId(filters.programId);
    }
    return this.courseModel.countDocuments(filter).exec();
  }
}
