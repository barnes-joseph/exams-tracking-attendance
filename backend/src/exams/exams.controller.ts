import { Controller, Get, Post, Put, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto } from './exam.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() createExamDto: CreateExamDto, @Request() req) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('examScheduleId') examScheduleId?: string,
    @Query('courseId') courseId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('invigilatorId') invigilatorId?: string,
  ) {
    return this.examsService.findAll({
      examScheduleId,
      courseId,
      date,
      status,
      invigilatorId,
    });
  }

  @Get('today')
  findTodaysExams() {
    return this.examsService.findTodaysExams();
  }

  @Get('count')
  count(@Query('examScheduleId') examScheduleId?: string) {
    return this.examsService.count(examScheduleId);
  }

  @Get('schedule/:examScheduleId')
  findBySchedule(@Param('examScheduleId') examScheduleId: string) {
    return this.examsService.findBySchedule(examScheduleId);
  }

  @Get('invigilator/:invigilatorId')
  findByInvigilator(
    @Param('invigilatorId') invigilatorId: string,
    @Query('date') date?: string,
  ) {
    return this.examsService.findByInvigilator(
      invigilatorId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('my-exams')
  findMyExams(@Request() req, @Query('date') date?: string) {
    return this.examsService.findByInvigilator(
      req.user.id,
      date ? new Date(date) : undefined,
    );
  }

  @Get('my-assignments/today')
  findMyAssignmentsToday(@Request() req) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.examsService.findByInvigilator(req.user.id, today);
  }

  @Get('my-assignments')
  findMyAssignments(
    @Request() req,
    @Query('status') status?: string,
    @Query('period') period?: string,
  ) {
    return this.examsService.findByInvigilatorWithFilters(req.user.id, { status, period });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Get(':id/assignments')
  findExamAssignments(@Param('id') id: string) {
    return this.examsService.findExamAssignments(id);
  }

  @Get(':id/attendance')
  findExamAttendance(@Param('id') id: string) {
    return this.examsService.findExamAttendance(id);
  }

  @Post(':id/auto-assign-students')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  autoAssignStudents(@Param('id') id: string) {
    return this.examsService.autoAssignStudents(id);
  }

  @Get('code/:examCode')
  findByCode(@Param('examCode') examCode: string) {
    return this.examsService.findByCode(examCode);
  }

  @Get('date/:date')
  findByDate(@Param('date') date: string) {
    return this.examsService.findByDate(new Date(date));
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  partialUpdate(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.examsService.updateStatus(id, status);
  }

  @Patch(':id/invigilators/add')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  addInvigilator(@Param('id') id: string, @Body('invigilatorId') invigilatorId: string) {
    return this.examsService.addInvigilator(id, invigilatorId);
  }

  @Patch(':id/invigilators/remove')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  removeInvigilator(@Param('id') id: string, @Body('invigilatorId') invigilatorId: string) {
    return this.examsService.removeInvigilator(id, invigilatorId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }
}
