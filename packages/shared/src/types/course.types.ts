export interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  moduleId: string;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverUrl?: string | null;
  isPublished: boolean;
  duration?: string | null;
  level?: string | null;
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    modules: number;
    progress: number;
  };
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  completedAt?: string | null;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithProgress extends Course {
  progress?: Progress | null;
}

export interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
