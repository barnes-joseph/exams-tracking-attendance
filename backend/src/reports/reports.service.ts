import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from '../attendance/attendance.schema';
import { Exam, ExamDocument } from '../exams/exam.schema';
import { ExamSchedule, ExamScheduleDocument } from '../exams/exam-schedule.schema';
import { ExamAssignment, ExamAssignmentDocument } from '../exams/exam-assignment.schema';
import { Student, StudentDocument } from '../students/student.schema';
import { College, CollegeDocument } from '../academic/college.schema';
import { Department, DepartmentDocument } from '../academic/department.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(ExamSchedule.name) private examScheduleModel: Model<ExamScheduleDocument>,
    @InjectModel(ExamAssignment.name) private examAssignmentModel: Model<ExamAssignmentDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(College.name) private collegeModel: Model<CollegeDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
  ) {}

  async getAdminDashboard(): Promise<{
    totalStudents: number;
    totalColleges: number;
    totalDepartments: number;
    totalExams: number;
    todayExams: number;
    attendanceToday: { present: number; absent: number; late: number };
    recentActivity: any[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      totalColleges,
      totalDepartments,
      totalExams,
      todayExams,
      todayAttendance,
    ] = await Promise.all([
      this.studentModel.countDocuments({ isActive: true }),
      this.collegeModel.countDocuments({ isActive: true }),
      this.departmentModel.countDocuments({ isActive: true }),
      this.examModel.countDocuments(),
      this.examModel.countDocuments({
        examDate: { $gte: today, $lt: tomorrow },
      }),
      this.attendanceModel.aggregate([
        {
          $lookup: {
            from: 'exams',
            localField: 'examId',
            foreignField: '_id',
            as: 'exam',
          },
        },
        { $unwind: '$exam' },
        {
          $match: {
            'exam.examDate': { $gte: today, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const attendanceToday = {
      present: 0,
      absent: 0,
      late: 0,
    };

    todayAttendance.forEach((item) => {
      if (item._id === 'PRESENT') attendanceToday.present = item.count;
      else if (item._id === 'ABSENT') attendanceToday.absent = item.count;
      else if (item._id === 'LATE') attendanceToday.late = item.count;
    });

    // Get recent attendance activity
    const recentActivity = await this.attendanceModel
      .find()
      .populate('studentId', 'firstName lastName indexNumber')
      .populate('examId', 'title courseCode')
      .sort({ checkInTime: -1 })
      .limit(10)
      .exec();

    return {
      totalStudents,
      totalColleges,
      totalDepartments,
      totalExams,
      todayExams,
      attendanceToday,
      recentActivity,
    };
  }

  async getExamScheduleAttendanceReport(scheduleId: string): Promise<{
    schedule: ExamSchedule;
    totalExams: number;
    totalAssigned: number;
    totalPresent: number;
    totalAbsent: number;
    attendanceRate: number;
    examsSummary: any[];
  }> {
    const schedule = await this.examScheduleModel.findById(scheduleId).exec();

    const exams = await this.examModel
      .find({ examScheduleId: new Types.ObjectId(scheduleId) })
      .exec();

    const examIds = exams.map(e => (e as any)._id);

    const [assignmentCount, attendanceSummary] = await Promise.all([
      this.examAssignmentModel.countDocuments({ examId: { $in: examIds } }),
      this.attendanceModel.aggregate([
        { $match: { examId: { $in: examIds } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let totalPresent = 0;
    let totalAbsent = 0;

    attendanceSummary.forEach((item) => {
      if (item._id === 'PRESENT' || item._id === 'LATE') {
        totalPresent += item.count;
      } else if (item._id === 'ABSENT') {
        totalAbsent += item.count;
      }
    });

    const examsSummary = await Promise.all(
      exams.map(async (exam) => {
        const examDoc = exam as any;
        const [assigned, attendance] = await Promise.all([
          this.examAssignmentModel.countDocuments({ examId: examDoc._id }),
          this.attendanceModel.aggregate([
            { $match: { examId: examDoc._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
        ]);

        const summary = { present: 0, absent: 0, late: 0 };
        attendance.forEach((item) => {
          if (item._id === 'PRESENT') summary.present = item.count;
          else if (item._id === 'ABSENT') summary.absent = item.count;
          else if (item._id === 'LATE') summary.late = item.count;
        });

        return {
          exam: {
            id: examDoc._id,
            title: examDoc.title,
            courseCode: examDoc.courseCode,
            examDate: examDoc.examDate,
            startTime: examDoc.startTime,
          },
          assigned,
          ...summary,
          attendanceRate: assigned > 0 ? ((summary.present + summary.late) / assigned) * 100 : 0,
        };
      })
    );

    return {
      schedule,
      totalExams: exams.length,
      totalAssigned: assignmentCount,
      totalPresent,
      totalAbsent,
      attendanceRate: assignmentCount > 0 ? (totalPresent / assignmentCount) * 100 : 0,
      examsSummary,
    };
  }

  async getExamAttendanceReport(examId: string): Promise<{
    exam: Exam;
    totalAssigned: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendanceRate: number;
    attendanceList: any[];
  }> {
    const exam = await this.examModel
      .findById(examId)
      .populate('courseId')
      .exec();

    const [assignments, attendance] = await Promise.all([
      this.examAssignmentModel
        .find({ examId: new Types.ObjectId(examId) })
        .populate('studentId', 'firstName lastName indexNumber email photo')
        .exec(),
      this.attendanceModel
        .find({ examId: new Types.ObjectId(examId) })
        .populate('studentId', 'firstName lastName indexNumber email photo')
        .populate('verifiedBy', 'firstName lastName')
        .exec(),
    ]);

    // Create attendance map
    const attendanceMap = new Map();
    attendance.forEach((a) => {
      const studentId = (a.studentId as any)?._id?.toString();
      if (studentId) {
        attendanceMap.set(studentId, a);
      }
    });

    // Build attendance list with assignment and attendance data
    const attendanceList = assignments.map((assignment) => {
      const studentId = (assignment.studentId as any)?._id?.toString();
      const attendanceRecord = attendanceMap.get(studentId);

      return {
        student: assignment.studentId,
        seatNumber: assignment.seatNumber,
        room: assignment.room,
        status: attendanceRecord?.status || 'ABSENT',
        checkInTime: attendanceRecord?.checkInTime,
        isLateEntry: attendanceRecord?.isLateEntry || false,
        minutesLate: attendanceRecord?.minutesLate || 0,
        verifiedBy: attendanceRecord?.verifiedBy,
        remarks: attendanceRecord?.remarks,
      };
    });

    const counts = { present: 0, absent: 0, late: 0 };
    attendanceList.forEach((a) => {
      if (a.status === 'PRESENT') counts.present++;
      else if (a.status === 'ABSENT') counts.absent++;
      else if (a.status === 'LATE') counts.late++;
    });

    return {
      exam,
      totalAssigned: assignments.length,
      totalPresent: counts.present,
      totalAbsent: counts.absent,
      totalLate: counts.late,
      attendanceRate: assignments.length > 0 ? ((counts.present + counts.late) / assignments.length) * 100 : 0,
      attendanceList,
    };
  }

  async getAbsenteeList(scheduleId: string): Promise<{
    schedule: ExamSchedule;
    absentees: any[];
  }> {
    const schedule = await this.examScheduleModel.findById(scheduleId).exec();

    const exams = await this.examModel
      .find({ examScheduleId: new Types.ObjectId(scheduleId) })
      .exec();

    const examIds = exams.map(e => (e as any)._id);

    // Get all assignments
    const assignments = await this.examAssignmentModel
      .find({ examId: { $in: examIds } })
      .populate('examId', 'title courseCode examDate')
      .populate('studentId', 'firstName lastName indexNumber email')
      .exec();

    // Get all attendance records
    const attendance = await this.attendanceModel
      .find({ examId: { $in: examIds }, status: { $ne: 'ABSENT' } })
      .exec();

    // Create a set of studentId-examId combinations that have attendance
    const presentSet = new Set(
      attendance.map(a => `${(a.studentId as any).toString()}-${(a.examId as any).toString()}`)
    );

    // Find absentees
    const absentees = assignments.filter((a) => {
      const key = `${(a.studentId as any)._id.toString()}-${(a.examId as any)._id.toString()}`;
      return !presentSet.has(key);
    }).map(a => ({
      student: a.studentId,
      exam: a.examId,
      seatNumber: a.seatNumber,
      room: a.room,
    }));

    return {
      schedule,
      absentees,
    };
  }

  async getStudentAttendanceHistory(studentId: string): Promise<{
    student: Student;
    totalExams: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
    history: any[];
  }> {
    const student = await this.studentModel.findById(studentId).exec();

    const attendance = await this.attendanceModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('examId', 'title courseCode examDate startTime venue')
      .sort({ checkInTime: -1 })
      .exec();

    const counts = { present: 0, absent: 0, late: 0 };
    attendance.forEach((a) => {
      if (a.status === 'PRESENT') counts.present++;
      else if (a.status === 'ABSENT') counts.absent++;
      else if (a.status === 'LATE') counts.late++;
    });

    return {
      student,
      totalExams: attendance.length,
      presentCount: counts.present,
      absentCount: counts.absent,
      lateCount: counts.late,
      attendanceRate: attendance.length > 0 ? ((counts.present + counts.late) / attendance.length) * 100 : 0,
      history: attendance,
    };
  }
}
