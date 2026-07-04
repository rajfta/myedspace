export interface Course {
  id: string;
  subject: string;
  yearRange: string;
  price: number;
  createdAt: string;
}

export interface OrderResult {
  orderId: string;
  course: { id: string; subject: string; yearRange: string };
  invitationToken: string;
  invitationPath: string;
}

export interface EnrollmentInfo {
  status: 'PENDING' | 'ACTIVATED';
  studentEmail: string;
  studentAlreadyActive: boolean;
  course: { id: string; subject: string; yearRange: string };
}

export interface AuthResult {
  accessToken: string;
  student: { id: string; email: string; fullName: string };
}

export interface Dashboard {
  id: string;
  email: string;
  fullName: string;
  courses: { id: string; subject: string; yearRange: string; enrolledAt: string }[];
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  courseId: string;
  completed: boolean;
}
