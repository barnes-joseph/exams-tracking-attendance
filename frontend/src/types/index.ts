// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INVIGILATOR';
  department?: string;
  type: 'user';
}

export interface Student {
  id: string;
  indexNumber: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  photo?: string;
  programId: string;
  departmentId?: string;
  level: number;
  enrollmentYear: number;
  currentAcademicYear: string;
  currentSemester: 1 | 2;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'DEFERRED' | 'WITHDRAWN';
  isActive: boolean;
}

export type AuthUser = (User | (Student & { role: 'STUDENT'; type: 'student' }));

// Academic types
export interface College {
  _id: string;
  code: string;
  name: string;
  description?: string;
  dean?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface Department {
  _id: string;
  code: string;
  name: string;
  abbreviation?: string;
  collegeId: string | College;
  headOfDepartment?: string;
  description?: string;
  isActive: boolean;
}

export interface Program {
  _id: string;
  code: string;
  name: string;
  abbreviation?: string;
  departmentId: string | Department;
  degreeType: 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DIPLOMA' | 'CERTIFICATE';
  duration: number;
  semestersPerYear: number;
  isActive: boolean;
}

export interface Course {
  _id: string;
  code: string;
  name: string;
  departmentId: string | Department;
  programId?: string | Program;
  creditHours: number;
  level: number;
  semester: 1 | 2;
  lecturer?: string;
  isActive: boolean;
  isElective: boolean;
}

// Exam types
export interface ExamSchedule {
  _id: string;
  name: string;
  academicYear: string;
  semester: 1 | 2;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  description?: string;
  qrCodesGenerated: boolean;
  qrCodesSent: boolean;
}

export interface Venue {
  name: string;
  building?: string;
  room?: string;
  capacity?: number;
}

export interface Exam {
  _id: string;
  examCode: string;
  title: string;
  examScheduleId: string | ExamSchedule;
  courseId: string | Course;
  courseCode?: string;
  courseName?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  venue: Venue;
  invigilators: string[] | User[];
  chiefInvigilator?: string | User;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  totalAssignedStudents: number;
  presentCount: number;
  absentCount: number;
}

export interface ExamAssignment {
  _id: string;
  examId: string | Exam;
  studentId: string | Student;
  seatNumber?: string;
  room?: string;
  status: 'ASSIGNED' | 'CONFIRMED' | 'ABSENT' | 'PRESENT' | 'DEFERRED';
  qrToken?: string;
  qrEmailSent: boolean;
}

// Attendance types
export interface Attendance {
  _id: string;
  examId: string | Exam;
  studentId: string | Student;
  indexNumber: string;
  checkInTime: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  studentVerified: boolean;
  verificationMethod: 'QR_SCAN' | 'MANUAL' | 'BIOMETRIC';
  verifiedBy?: string | User;
  isLateEntry: boolean;
  minutesLate?: number;
  isFlagged: boolean;
  flagReason?: string;
  flagStatus: 'NONE' | 'PENDING' | 'RESOLVED' | 'ESCALATED';
  remarks?: string;
}

// Enrollment types
export interface Enrollment {
  _id: string;
  studentId: string | Student;
  courseId: string | Course;
  academicYear: string;
  semester: 1 | 2;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED' | 'FAILED' | 'WITHDRAWN';
  grade?: string;
  score?: number;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
