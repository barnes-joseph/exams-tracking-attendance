import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: string,
    @Query('collegeId') collegeId?: string,
    @Query('search') search?: string,
  ) {
    return this.departmentService.findAllPaginated(page, limit, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      collegeId,
      search,
    });
  }

  @Get('count')
  count(@Query('collegeId') collegeId?: string) {
    return this.departmentService.count(collegeId);
  }

  @Get('college/:collegeId')
  findByCollege(@Param('collegeId') collegeId: string) {
    return this.departmentService.findByCollege(collegeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.departmentService.findByCode(code);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
