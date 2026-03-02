import { Controller, Post, Body, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { VerifyQrCodeDto } from './qr-code.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('qr-codes')
@UseGuards(JwtAuthGuard)
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post('verify')
  verify(@Body() verifyQrCodeDto: VerifyQrCodeDto, @Request() req) {
    return this.qrCodeService.verifyToken(
      verifyQrCodeDto.token,
      verifyQrCodeDto.ipAddress,
      verifyQrCodeDto.deviceInfo,
      req.user?.id,
    );
  }

  @Post('mark-used')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INVIGILATOR')
  markAsUsed(@Body() body: { token: string; ipAddress?: string; deviceInfo?: string }) {
    return this.qrCodeService.markAsUsed(body.token, body.ipAddress, body.deviceInfo);
  }

  @Post(':id/revoke')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  revoke(@Param('id') id: string, @Body('reason') reason: string) {
    return this.qrCodeService.revokeToken(id, reason);
  }

  @Get('assignment/:assignmentId')
  findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.qrCodeService.findByAssignment(assignmentId);
  }

  @Get('assignment/:assignmentId/with-image')
  getTokenWithImage(@Param('assignmentId') assignmentId: string) {
    return this.qrCodeService.getTokenWithQrImage(assignmentId);
  }

  @Get('exam/:examId')
  findByExam(@Param('examId') examId: string) {
    return this.qrCodeService.findByExam(examId);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.qrCodeService.findByStudent(studentId);
  }

  @Get('my-codes')
  findMyQrCodes(@Request() req) {
    return this.qrCodeService.findByStudent(req.user.id);
  }

  @Get('count')
  count(@Query('examId') examId?: string) {
    return this.qrCodeService.count(examId);
  }
}
