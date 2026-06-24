export interface School {
  id: string
  name: string
  city: string
  municipality: string
  address: string
  postalCode: string
  lat: number
  lng: number
  rating: number
  reviewCount: number
  phone: string
  email: string
  website: string
  description: string
  type: 'gymnasium' | 'komvux' | 'folkhögskola' | 'privat'
  imageUrl: string
  subjects: string[]
  certifications: string[]
  established: number
  studentCount: number
  successRate: number
}

export interface Exam {
  id: string
  schoolId: string
  school?: School
  subject: string
  course: string
  courseCode: string
  level: 'Gymnasiekurs' | 'Grundskolekurs' | 'Högskolekurs'
  points: number
  date: string
  time: string
  duration: number
  location: string
  room?: string
  availableSpots: number
  totalSpots: number
  price: number
  registrationDeadline: string
  description: string
  requirements: string[]
  materials: string[]
  examiner: string
  isPopular: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  schoolId: string
  userName: string
  rating: number
  title: string
  content: string
  course: string
  date: string
  helpful: number
  verified: boolean
}

export interface BookingPersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  personnummer?: string
  currentGrade?: string
  message?: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Booking {
  id: string
  referenceNumber: string
  examId: string
  schoolId: string
  personalInfo: BookingPersonalInfo
  status: BookingStatus
  createdAt: string
}

export interface SearchFilters {
  query: string
  subject?: string
  city?: string
  dateFrom?: string
  dateTo?: string
  level?: string
  maxPrice?: number
  minSpots?: number
  sortBy: 'date' | 'price' | 'rating' | 'spots' | 'distance'
  sortOrder: 'asc' | 'desc'
}
