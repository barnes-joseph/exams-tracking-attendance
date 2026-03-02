import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Program, ProgramDocument } from './program.schema';
import { CreateProgramDto, UpdateProgramDto } from './program.dto';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
  ) {}

  async create(createProgramDto: CreateProgramDto): Promise<Program> {
    const existingProgram = await this.programModel.findOne({ code: createProgramDto.code });
    if (existingProgram) {
      throw new ConflictException(`Program with code ${createProgramDto.code} already exists`);
    }

    const program = new this.programModel({
      ...createProgramDto,
      departmentId: new Types.ObjectId(createProgramDto.departmentId),
    });
    return program.save();
  }

  async findAll(query?: {
    isActive?: boolean;
    departmentId?: string;
    degreeType?: string;
    search?: string;
  }): Promise<Program[]> {
    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.departmentId) {
      filter.departmentId = new Types.ObjectId(query.departmentId);
    }

    if (query?.degreeType) {
      filter.degreeType = query.degreeType;
    }

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { abbreviation: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.programModel
      .find(filter)
      .populate('departmentId')
      .sort({ name: 1 })
      .exec();
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    query?: {
      isActive?: boolean;
      departmentId?: string;
      degreeType?: string;
      search?: string;
    },
  ): Promise<{ data: Program[]; total: number; page: number; limit: number; totalPages: number }> {
    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.departmentId) {
      filter.departmentId = new Types.ObjectId(query.departmentId);
    }

    if (query?.degreeType) {
      filter.degreeType = query.degreeType;
    }

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { abbreviation: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await this.programModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const data = await this.programModel
      .find(filter)
      .populate('departmentId')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programModel
      .findById(id)
      .populate('departmentId')
      .exec();
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  async findByCode(code: string): Promise<Program> {
    const program = await this.programModel
      .findOne({ code })
      .populate('departmentId')
      .exec();
    if (!program) {
      throw new NotFoundException(`Program with code ${code} not found`);
    }
    return program;
  }

  async findByDepartment(departmentId: string): Promise<Program[]> {
    return this.programModel
      .find({ departmentId: new Types.ObjectId(departmentId) })
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateProgramDto: UpdateProgramDto): Promise<Program> {
    if (updateProgramDto.code) {
      const existingProgram = await this.programModel.findOne({
        code: updateProgramDto.code,
        _id: { $ne: id },
      });
      if (existingProgram) {
        throw new ConflictException(`Program with code ${updateProgramDto.code} already exists`);
      }
    }

    const updateData: any = { ...updateProgramDto };
    if (updateProgramDto.departmentId) {
      updateData.departmentId = new Types.ObjectId(updateProgramDto.departmentId);
    }

    const program = await this.programModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('departmentId')
      .exec();
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  async remove(id: string): Promise<void> {
    const result = await this.programModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
  }

  async count(departmentId?: string): Promise<number> {
    const filter: any = {};
    if (departmentId) {
      filter.departmentId = new Types.ObjectId(departmentId);
    }
    return this.programModel.countDocuments(filter).exec();
  }
}
