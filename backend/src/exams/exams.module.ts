import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Exam, ExamSchema } from './exam.schema';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

import { ExamSchedule, ExamScheduleSchema } from './exam-schedule.schema';
import { ExamScheduleService } from './exam-schedule.service';
import { ExamScheduleController } from './exam-schedule.controller';

import { ExamAssignment, ExamAssignmentSchema } from './exam-assignment.schema';
import { ExamAssignmentService } from './exam-assignment.service';
import { ExamAssignmentController } from './exam-assignment.controller';

import { Attendance, AttendanceSchema } from '../attendance/attendance.schema';
import { Enrollment, EnrollmentSchema } from '../enrollments/enrollment.schema';
import { QRCodeModule } from '../qr-code/qr-code.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: ExamSchedule.name, schema: ExamScheduleSchema },
      { name: ExamAssignment.name, schema: ExamAssignmentSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    forwardRef(() => QRCodeModule),
  ],
  controllers: [
    ExamsController,
    ExamScheduleController,
    ExamAssignmentController,
  ],
  providers: [
    ExamsService,
    ExamScheduleService,
    ExamAssignmentService,
  ],
  exports: [
    ExamsService,
    ExamScheduleService,
    ExamAssignmentService,
  ],
})
export class ExamsModule {}
