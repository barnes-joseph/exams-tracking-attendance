import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const navigation = [
  { name: 'Dashboard', href: '/student' },
  { name: 'My Exams', href: '/student/my-exams' },
  { name: 'Attendance History', href: '/student/history' },
];

export function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const studentUser = user && 'indexNumber' in user ? user : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-white">Student Portal</span>
              <nav className="hidden md:flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      location.pathname === item.href
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-500'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {studentUser && (
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {studentUser.firstName} {studentUser.lastName}
                  </p>
                  <p className="text-xs text-blue-200">{studentUser.indexNumber}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-blue-600 bg-white rounded hover:bg-blue-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* Mobile navigation */}
        <nav className="md:hidden px-4 pb-3 flex space-x-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`px-3 py-1 text-sm font-medium rounded ${
                location.pathname === item.href
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-500'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
