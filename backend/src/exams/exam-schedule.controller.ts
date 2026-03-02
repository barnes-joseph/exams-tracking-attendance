import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ExamScheduleService } from './exam-schedule.service';
import { CreateExamScheduleDto, UpdateExamScheduleDto } from './exam-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('exam-schedules')
@UseGuards(JwtAuthGuard)
export class ExamScheduleController {
  constructor(private readonly examScheduleService: ExamScheduleService) {}

  @Post(':id/generate-qr-codes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async generateQrCodes(@Param('id') id: string, @Request() req) {
    return this.examScheduleService.generateQrCodes(id, req.user?.id);
  }

  @Post(':id/send-qr-codes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async sendQrCodes(@Param('id') id: string, @Request() req) {
    return this.examScheduleService.sendQrCodes(id, req.user?.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() createExamScheduleDto: CreateExamScheduleDto, @Request() req) {
    return this.examScheduleService.create(createExamScheduleDto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('academicYear') academicYear?: string,
    @Query('semester') semester?: string,
    @Query('status') status?: string,
  ) {
    return this.examScheduleService.findAll({
      academicYear,
      semester: semester ? parseInt(semester, 10) : undefined,
      status,
    });
  }

  @Get('current')
  findCurrent() {
    return this.examScheduleService.findCurrent();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.examScheduleService.findUpcoming();
  }

  @Get('count')
  count() {
    return this.examScheduleService.count();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examScheduleService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateExamScheduleDto: UpdateExamScheduleDto) {
    return this.examScheduleService.update(id, updateExamScheduleDto);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  publish(@Param('id') id: string, @Request() req) {
    return this.examScheduleService.publish(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.examScheduleService.remove(id);
  }
}
