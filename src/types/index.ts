export interface Exam {
  id: string;
  schoolName: string;
  schoolImage: string;
  subject: string;
  course: string;
  courseCode: string;
  level: 'Gymnasieskola' | 'Komvux';
  city: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  applicationDeadline: string;
  examDate: string;
  resultDate: string;
  components: ExamComponent[];
  studyTips: string[];
  registrationUrl: string;
  availableSpots?: number;
  description: string;
  tags: string[];
}

export interface ExamComponent {
  name: string;
  duration: string;
  description: string;
}

export interface SavedExam {
  examId: string;
  savedAt: string;
  notes?: string;
  status: 'interested' | 'registered' | 'completed' | 'passed' | 'failed';
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  subject?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  replies: Reply[];
  tags: string[];
}

export interface Reply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  following: string[];
  followers: string[];
  completedExams: CompletedExam[];
  joinedAt: string;
  location: string;
}

export interface CompletedExam {
  examId: string;
  schoolName: string;
  subject: string;
  course: string;
  date: string;
  grade?: string;
}

export type TabId = 'discover' | 'exams' | 'calendar' | 'community' | 'profile';
