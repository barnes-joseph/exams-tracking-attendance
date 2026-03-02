import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import 'multer';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, BulkImportStudentDto } from './student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Post('bulk-import')
  bulkImport(@Body() bulkImportDto: BulkImportStudentDto) {
    return this.studentsService.bulkImport(bulkImportDto.students);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('programId') programId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.studentsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      programId,
      departmentId,
      level: level ? parseInt(level, 10) : undefined,
      status,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('count')
  count(
    @Query('programId') programId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
  ) {
    return this.studentsService.count({
      programId,
      departmentId,
      level: level ? parseInt(level, 10) : undefined,
      status,
    });
  }

  @Get('program/:programId')
  findByProgram(@Param('programId') programId: string) {
    return this.studentsService.findByProgram(programId);
  }

  @Get('department/:departmentId')
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.studentsService.findByDepartment(departmentId);
  }

  @Get('level/:level/semester/:semester')
  findByLevelAndSemester(
    @Param('level') level: string,
    @Param('semester') semester: string,
    @Query('programId') programId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.studentsService.findByLevelAndSemester(
      parseInt(level, 10),
      parseInt(semester, 10),
      programId,
      departmentId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get('index/:indexNumber')
  findByIndexNumber(@Param('indexNumber') indexNumber: string) {
    return this.studentsService.findByIndexNumber(indexNumber);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Patch(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async updatePhoto(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body('photoUrl') photoUrl?: string,
  ) {
    // If a file is uploaded, you would handle file storage here
    // For now, we'll just accept a URL directly
    const url = photoUrl || (file ? `/uploads/photos/${file.filename}` : '');
    return this.studentsService.updatePhoto(id, url);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
