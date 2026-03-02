import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Attendance, AttendanceSchema } from '../attendance/attendance.schema';
import { Exam, ExamSchema } from '../exams/exam.schema';
import { ExamSchedule, ExamScheduleSchema } from '../exams/exam-schedule.schema';
import { ExamAssignment, ExamAssignmentSchema } from '../exams/exam-assignment.schema';
import { Student, StudentSchema } from '../students/student.schema';
import { College, CollegeSchema } from '../academic/college.schema';
import { Department, DepartmentSchema } from '../academic/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: ExamSchedule.name, schema: ExamScheduleSchema },
      { name: ExamAssignment.name, schema: ExamAssignmentSchema },
      { name: Student.name, schema: StudentSchema },
      { name: College.name, schema: CollegeSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
