import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ScanQrDto, ManualMarkDto, FlagAttendanceDto, ResolveAttendanceDto } from './attendance.dto';
import { QrCodeService } from '../qr-code/qr-code.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  @Post('scan-qr')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  async scanQr(@Body() scanQrDto: ScanQrDto, @Request() req) {
    // Verify the QR code
    const verification = await this.qrCodeService.verifyToken(
      scanQrDto.token,
      scanQrDto.ipAddress,
      scanQrDto.deviceInfo,
      req.user.id,
    );

    if (!verification.valid) {
      return {
        success: false,
        message: verification.message,
        attendance: null,
        student: null,
      };
    }

    const { qrCodeToken, payload } = verification;

    // Validate payload has required fields
    if (!payload || !payload.examId || !payload.studentId || !payload.indexNumber) {
      return {
        success: false,
        message: 'Invalid QR code: missing required data in token',
        attendance: null,
        student: qrCodeToken?.studentId || null,
      };
    }

    try {
      // Record attendance
      const attendance = await this.attendanceService.recordAttendance(
        payload.examId,
        payload.studentId,
        payload.indexNumber,
        {
          examAssignmentId: payload.assignmentId,
          verificationMethod: 'QR_SCAN',
          verifiedBy: req.user.id,
          studentVerified: scanQrDto.studentVerified || false,
          ipAddress: scanQrDto.ipAddress,
          deviceInfo: scanQrDto.deviceInfo,
        },
      );

      // Mark QR code as used
      await this.qrCodeService.markAsUsed(scanQrDto.token, scanQrDto.ipAddress, scanQrDto.deviceInfo);

      // Fetch populated attendance record
      const populatedAttendance = await this.attendanceService.findByExamAndStudent(
        payload.examId,
        payload.studentId,
      );

      return {
        success: true,
        message: 'Attendance recorded successfully',
        attendance: populatedAttendance || attendance,
        student: qrCodeToken.studentId,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        attendance: null,
        student: qrCodeToken?.studentId || null,
      };
    }
  }

  @Post('manual-mark')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  manualMark(@Body() manualMarkDto: ManualMarkDto, @Request() req) {
    return this.attendanceService.manualMark(manualMarkDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('examId') examId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('isFlagged') isFlagged?: string,
  ) {
    return this.attendanceService.findAll({
      examId,
      studentId,
      status: status as any,
      isFlagged: isFlagged === 'true' ? true : isFlagged === 'false' ? false : undefined,
    });
  }

  @Get('exam/:examId')
  findByExam(@Param('examId') examId: string) {
    return this.attendanceService.findByExam(examId);
  }

  @Get('exam/:examId/count')
  countByExam(@Param('examId') examId: string) {
    return this.attendanceService.countByExam(examId);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.attendanceService.findByStudent(studentId);
  }

  @Get('my-history')
  findMyHistory(@Request() req) {
    return this.attendanceService.findByStudent(req.user.id);
  }

  @Get('flagged')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getFlagged(@Query('examId') examId?: string) {
    return this.attendanceService.getFlaggedAttendance(examId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Get('exam/:examId/student/:studentId')
  findByExamAndStudent(
    @Param('examId') examId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.attendanceService.findByExamAndStudent(examId, studentId);
  }

  @Post(':id/flag')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  flag(@Param('id') id: string, @Body() flagDto: FlagAttendanceDto, @Request() req) {
    return this.attendanceService.flag(id, flagDto, req.user.id);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  resolve(@Param('id') id: string, @Body() resolveDto: ResolveAttendanceDto, @Request() req) {
    return this.attendanceService.resolve(id, resolveDto, req.user.id);
  }

  @Post(':id/verify-student')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  verifyStudent(@Param('id') id: string, @Request() req) {
    return this.attendanceService.verifyStudent(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.attendanceService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }
}