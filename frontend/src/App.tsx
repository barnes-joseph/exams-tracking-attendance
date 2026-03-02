import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
import { AdminLayout, InvigilatorLayout, StudentLayout } from './components/layout';

// Auth components
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Auth pages
import { LoginPage, StudentLoginPage } from './pages/auth';

// Admin pages
import {
  AdminDashboard,
  CollegesPage,
  DepartmentsPage,
  ProgramsPage,
  CoursesPage,
  StudentsPage,
  UsersPage,
  EnrollmentsPage,
  ExamSchedulesPage,
  ExamsPage,
  ReportsPage,
} from './pages/admin';

// Invigilator pages
import {
  InvigilatorDashboard,
  TodayExamsPage,
  MyAssignmentsPage,
  ScannerPage,
  AttendancePage,
} from './pages/invigilator';

// Student pages
import { StudentDashboard, MyExamsPage, QRCodePage, HistoryPage } from './pages/student';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="colleges" element={<CollegesPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="exam-schedules" element={<ExamSchedulesPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* Invigilator routes */}
          <Route
            path="/invigilator"
            element={
              <ProtectedRoute allowedRoles={['INVIGILATOR']}>
                <InvigilatorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<InvigilatorDashboard />} />
            <Route path="today-exams" element={<TodayExamsPage />} />
            <Route path="assignments" element={<MyAssignmentsPage />} />
            <Route path="scanner/:examId" element={<ScannerPage />} />
            <Route path="attendance/:examId" element={<AttendancePage />} />
          </Route>

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="my-exams" element={<MyExamsPage />} />
            <Route path="qr/:examId" element={<QRCodePage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
