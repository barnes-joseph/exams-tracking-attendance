import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ExamAssignmentService } from './exam-assignment.service';
import { CreateExamAssignmentDto, UpdateExamAssignmentDto, BulkAssignDto } from './exam-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('exam-assignments')
@UseGuards(JwtAuthGuard)
export class ExamAssignmentController {
  constructor(private readonly examAssignmentService: ExamAssignmentService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() createExamAssignmentDto: CreateExamAssignmentDto, @Request() req) {
    return this.examAssignmentService.create(createExamAssignmentDto, req.user?.id);
  }

  @Post('bulk-assign')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  bulkAssign(@Body() bulkAssignDto: BulkAssignDto, @Request() req) {
    return this.examAssignmentService.bulkAssign(bulkAssignDto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.examAssignmentService.findAll({
      examId,
      studentId,
      status,
    });
  }

  @Get('count')
  count(@Query('examId') examId?: string) {
    return this.examAssignmentService.count(examId);
  }

  @Get('count-by-status/:examId')
  countByStatus(@Param('examId') examId: string) {
    return this.examAssignmentService.countByStatus(examId);
  }

  @Get('exam/:examId')
  findByExam(@Param('examId') examId: string) {
    return this.examAssignmentService.findByExam(examId);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.examAssignmentService.findByStudent(studentId);
  }

  @Get('my-assignments')
  findMyAssignments(@Request() req) {
    return this.examAssignmentService.findByStudent(req.user.id);
  }

  @Get('exam/:examId/student/:studentId')
  findByExamAndStudent(
    @Param('examId') examId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.examAssignmentService.findByExamAndStudent(examId, studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examAssignmentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateExamAssignmentDto: UpdateExamAssignmentDto) {
    return this.examAssignmentService.update(id, updateExamAssignmentDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.examAssignmentService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.examAssignmentService.remove(id);
  }

  @Delete('exam/:examId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  removeByExam(@Param('examId') examId: string) {
    return this.examAssignmentService.removeByExam(examId);
  }
}
