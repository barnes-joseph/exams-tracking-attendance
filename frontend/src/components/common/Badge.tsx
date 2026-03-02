interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
  size?: 'sm' | 'md';
}

const variantStyles = {
  gray: 'bg-gray-100 text-gray-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}

// Helper function to get status badge variant
export function getStatusVariant(status: string): BadgeProps['variant'] {
  const statusMap: Record<string, BadgeProps['variant']> = {
    // General
    ACTIVE: 'green',
    INACTIVE: 'gray',

    // Exam Schedule
    DRAFT: 'gray',
    PUBLISHED: 'blue',
    IN_PROGRESS: 'yellow',
    COMPLETED: 'green',
    CANCELLED: 'red',

    // Exam
    SCHEDULED: 'blue',
    POSTPONED: 'yellow',

    // Attendance
    PRESENT: 'green',
    ABSENT: 'red',
    LATE: 'yellow',
    EXCUSED: 'purple',

    // Student status
    SUSPENDED: 'red',
    GRADUATED: 'blue',
    DEFERRED: 'yellow',
    WITHDRAWN: 'gray',

    // Enrollment
    ENROLLED: 'green',
    DROPPED: 'red',
    FAILED: 'red',

    // Assignment
    ASSIGNED: 'blue',
    CONFIRMED: 'green',
  };

  return statusMap[status] || 'gray';
}
