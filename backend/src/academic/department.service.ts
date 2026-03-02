import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from './department.schema';
import { CreateDepartmentDto, UpdateDepartmentDto } from './department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const existingDepartment = await this.departmentModel.findOne({ code: createDepartmentDto.code });
    if (existingDepartment) {
      throw new ConflictException(`Department with code ${createDepartmentDto.code} already exists`);
    }

    const department = new this.departmentModel({
      ...createDepartmentDto,
      collegeId: new Types.ObjectId(createDepartmentDto.collegeId),
    });
    return department.save();
  }

  async findAll(query?: {
    isActive?: boolean;
    collegeId?: string;
    search?: string;
  }): Promise<Department[]> {
    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.collegeId) {
      filter.collegeId = new Types.ObjectId(query.collegeId);
    }

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { abbreviation: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.departmentModel
      .find(filter)
      .populate('collegeId')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentModel
      .findById(id)
      .populate('collegeId')
      .exec();
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async findByCode(code: string): Promise<Department> {
    const department = await this.departmentModel
      .findOne({ code })
      .populate('collegeId')
      .exec();
    if (!department) {
      throw new NotFoundException(`Department with code ${code} not found`);
    }
    return department;
  }

  async findByCollege(collegeId: string): Promise<Department[]> {
    return this.departmentModel
      .find({ collegeId: new Types.ObjectId(collegeId) })
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    if (updateDepartmentDto.code) {
      const existingDepartment = await this.departmentModel.findOne({
        code: updateDepartmentDto.code,
        _id: { $ne: id },
      });
      if (existingDepartment) {
        throw new ConflictException(`Department with code ${updateDepartmentDto.code} already exists`);
      }
    }

    const updateData: any = { ...updateDepartmentDto };
    if (updateDepartmentDto.collegeId) {
      updateData.collegeId = new Types.ObjectId(updateDepartmentDto.collegeId);
    }

    const department = await this.departmentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('collegeId')
      .exec();
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async remove(id: string): Promise<void> {
    const result = await this.departmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
  }

  async count(collegeId?: string): Promise<number> {
    const filter: any = {};
    if (collegeId) {
      filter.collegeId = new Types.ObjectId(collegeId);
    }
    return this.departmentModel.countDocuments(filter).exec();
  }
}
