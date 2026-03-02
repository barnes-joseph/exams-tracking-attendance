import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto } from './course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: string,
    @Query('departmentId') departmentId?: string,
    @Query('programId') programId?: string,
    @Query('level') level?: string,
    @Query('semester') semester?: string,
    @Query('isElective') isElective?: string,
    @Query('search') search?: string,
  ) {
    return this.courseService.findAllPaginated(page, limit, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      departmentId,
      programId,
      level: level ? parseInt(level, 10) : undefined,
      semester: semester ? parseInt(semester, 10) : undefined,
      isElective: isElective === 'true' ? true : isElective === 'false' ? false : undefined,
      search,
    });
  }

  @Get('count')
  count(
    @Query('departmentId') departmentId?: string,
    @Query('programId') programId?: string,
  ) {
    return this.courseService.count({ departmentId, programId });
  }

  @Get('department/:departmentId')
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.courseService.findByDepartment(departmentId);
  }

  @Get('program/:programId')
  findByProgram(@Param('programId') programId: string) {
    return this.courseService.findByProgram(programId);
  }

  @Get('level/:level/semester/:semester')
  findByLevelAndSemester(
    @Param('level') level: string,
    @Param('semester') semester: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.courseService.findByLevelAndSemester(
      parseInt(level, 10),
      parseInt(semester, 10),
      departmentId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.courseService.findByCode(code);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
