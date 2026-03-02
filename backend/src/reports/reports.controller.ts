import { Controller, Get, Param, UseGuards, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('admin-dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getAdminDashboard() {
    return this.reportsService.getAdminDashboard();
  }

  @Get('exam-schedule/:scheduleId/attendance')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getExamScheduleAttendance(@Param('scheduleId') scheduleId: string) {
    return this.reportsService.getExamScheduleAttendanceReport(scheduleId);
  }

  @Get('exam/:examId/attendance')
  getExamAttendance(
    @Param('examId') examId: string,
    @Query('format') format?: string,
  ) {
    // For now, return JSON. PDF/CSV generation can be added later.
    return this.reportsService.getExamAttendanceReport(examId);
  }

  @Get('absentee-list/:scheduleId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getAbsenteeList(@Param('scheduleId') scheduleId: string) {
    return this.reportsService.getAbsenteeList(scheduleId);
  }

  @Get('student/:studentId/attendance-history')
  getStudentAttendanceHistory(@Param('studentId') studentId: string) {
    return this.reportsService.getStudentAttendanceHistory(studentId);
  }
}
