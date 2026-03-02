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
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import 'multer';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, BulkImportStudentDto } from './student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExamAssignmentService } from '../exams/exam-assignment.service';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly examAssignmentService: ExamAssignmentService,
  ) {}

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

  @Get('me/upcoming-exams')
  async getMyUpcomingExams(@Request() req) {
    // Only students can access this endpoint
    if (req.user?.type !== 'student') {
      return [];
    }

    const studentId = req.user.id;
    const assignments = await this.examAssignmentService.findByStudent(studentId);

    // Get current date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter for upcoming exams and transform the data
    const upcomingExams = assignments
      .filter((assignment: any) => {
        const exam = assignment.examId;
        if (!exam) return false;
        const examDate = new Date(exam.examDate);
        return examDate >= today && exam.status === 'SCHEDULED';
      })
      .map((assignment: any) => {
        const exam = assignment.examId;
        return {
          _id: exam._id,
          examCode: exam.examCode,
          title: exam.title,
          courseCode: exam.courseCode,
          courseName: exam.courseName,
          examDate: exam.examDate,
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: exam.duration,
          venue: exam.venue,
          status: exam.status,
          assignmentId: assignment._id,
          hasQrCode: !!assignment.qrToken,
          seatNumber: assignment.seatNumber,
          room: assignment.room,
        };
      })
      .sort((a: any, b: any) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    return upcomingExams;
  }

  @Get('me/exams')
  async getMyExams(@Request() req, @Query('period') period?: string) {
    // Only students can access this endpoint
    if (req.user?.type !== 'student') {
      return [];
    }

    const studentId = req.user.id;
    const assignments = await this.examAssignmentService.findByStudent(studentId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter based on period
    let filteredAssignments = assignments.filter((a: any) => a.examId);

    if (period === 'upcoming') {
      filteredAssignments = filteredAssignments.filter((assignment: any) => {
        const examDate = new Date(assignment.examId.examDate);
        return examDate >= today;
      });
    } else if (period === 'past') {
      filteredAssignments = filteredAssignments.filter((assignment: any) => {
        const examDate = new Date(assignment.examId.examDate);
        return examDate < today;
      });
    }

    // Transform and sort
    const exams = filteredAssignments
      .map((assignment: any) => {
        const exam = assignment.examId;
        return {
          _id: exam._id,
          examCode: exam.examCode,
          title: exam.title,
          courseCode: exam.courseCode,
          courseName: exam.courseName,
          examDate: exam.examDate,
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: exam.duration,
          venue: exam.venue,
          status: exam.status,
          assignmentId: assignment._id,
          hasQrCode: !!assignment.qrToken,
          seatNumber: assignment.seatNumber,
          room: assignment.room,
        };
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.examDate).getTime();
        const dateB = new Date(b.examDate).getTime();
        return period === 'past' ? dateB - dateA : dateA - dateB;
      });

    return exams;
  }

  @Get('me/exam-assignment/:examId')
  async getMyExamAssignment(@Request() req, @Param('examId') examId: string) {
    // Only students can access this endpoint
    if (req.user?.type !== 'student') {
      return null;
    }

    const studentId = req.user.id;
    const assignment = await this.examAssignmentService.findByExamAndStudent(examId, studentId);

    if (!assignment) {
      return null;
    }

    const assignmentDoc = assignment as any;
    const exam = assignmentDoc.examId;

    return {
      _id: assignmentDoc._id,
      exam: exam ? {
        _id: exam._id,
        examCode: exam.examCode,
        title: exam.title,
        courseCode: exam.courseCode,
        courseName: exam.courseName,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        venue: exam.venue,
        status: exam.status,
      } : null,
      qrToken: assignmentDoc.qrToken,
      seatNumber: assignmentDoc.seatNumber,
      room: assignmentDoc.room,
      status: assignmentDoc.status,
    };
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
