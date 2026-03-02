import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto, BulkEnrollDto } from './enrollment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto, @Request() req) {
    return this.enrollmentsService.create(createEnrollmentDto, req.user?.id);
  }

  @Post('bulk-enroll')
  bulkEnroll(@Body() bulkEnrollDto: BulkEnrollDto, @Request() req) {
    return this.enrollmentsService.bulkEnroll(bulkEnrollDto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('courseId') courseId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
    @Query('status') status?: string,
  ) {
    return this.enrollmentsService.findAll({
      studentId,
      courseId,
      academicYear,
      semester: semester ? parseInt(semester, 10) : undefined,
      status: status as any,
    });
  }

  @Get('count')
  count(
    @Query('courseId') courseId?: string,
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.enrollmentsService.count({
      courseId,
      studentId,
      academicYear,
      semester: semester ? parseInt(semester, 10) : undefined,
    });
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId') studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.enrollmentsService.findByStudent(
      studentId,
      academicYear,
      semester ? parseInt(semester, 10) : undefined,
    );
  }

  @Get('course/:courseId')
  findByCourse(
    @Param('courseId') courseId: string,
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
  ) {
    return this.enrollmentsService.findByCourse(
      courseId,
      academicYear,
      semester ? parseInt(semester, 10) : undefined,
    );
  }

  @Get('course/:courseId/students')
  getEnrolledStudents(
    @Param('courseId') courseId: string,
    @Query('academicYear') academicYear: string,
    @Query('semester') semester: string,
  ) {
    return this.enrollmentsService.getEnrolledStudents(
      courseId,
      academicYear,
      parseInt(semester, 10),
    );
  }

  @Get('check')
  checkEnrollment(
    @Query('studentId') studentId: string,
    @Query('courseId') courseId: string,
    @Query('academicYear') academicYear: string,
    @Query('semester') semester: string,
  ) {
    return this.enrollmentsService.isStudentEnrolled(
      studentId,
      courseId,
      academicYear,
      parseInt(semester, 10),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnrollmentDto: UpdateEnrollmentDto) {
    return this.enrollmentsService.update(id, updateEnrollmentDto);
  }

  @Patch(':id/drop')
  drop(@Param('id') id: string) {
    return this.enrollmentsService.dropEnrollment(id);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() body: { grade: string; score?: number },
  ) {
    return this.enrollmentsService.completeEnrollment(id, body.grade, body.score);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }
}
