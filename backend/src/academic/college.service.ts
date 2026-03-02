import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { College, CollegeDocument } from './college.schema';
import { CreateCollegeDto, UpdateCollegeDto } from './college.dto';

@Injectable()
export class CollegeService {
  constructor(
    @InjectModel(College.name) private collegeModel: Model<CollegeDocument>,
  ) {}

  async create(createCollegeDto: CreateCollegeDto): Promise<College> {
    const existingCollege = await this.collegeModel.findOne({ code: createCollegeDto.code });
    if (existingCollege) {
      throw new ConflictException(`College with code ${createCollegeDto.code} already exists`);
    }
    const college = new this.collegeModel(createCollegeDto);
    return college.save();
  }

  async findAll(query?: { isActive?: boolean; search?: string }): Promise<College[]> {
    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.collegeModel.find(filter).sort({ name: 1 }).exec();
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    query?: { isActive?: boolean; search?: string },
  ): Promise<{ data: College[]; total: number; page: number; limit: number; totalPages: number }> {
    const filter: any = {};

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await this.collegeModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const data = await this.collegeModel
      .find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, limit, totalPages };
  }

  async findOne(id: string): Promise<College> {
    const college = await this.collegeModel.findById(id).exec();
    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    return college;
  }

  async findByCode(code: string): Promise<College> {
    const college = await this.collegeModel.findOne({ code }).exec();
    if (!college) {
      throw new NotFoundException(`College with code ${code} not found`);
    }
    return college;
  }

  async update(id: string, updateCollegeDto: UpdateCollegeDto): Promise<College> {
    if (updateCollegeDto.code) {
      const existingCollege = await this.collegeModel.findOne({
        code: updateCollegeDto.code,
        _id: { $ne: id }
      });
      if (existingCollege) {
        throw new ConflictException(`College with code ${updateCollegeDto.code} already exists`);
      }
    }

    const college = await this.collegeModel
      .findByIdAndUpdate(id, updateCollegeDto, { new: true })
      .exec();
    if (!college) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
    return college;
  }

  async remove(id: string): Promise<void> {
    const result = await this.collegeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`College with ID ${id} not found`);
    }
  }

  async count(): Promise<number> {
    return this.collegeModel.countDocuments().exec();
  }
}
