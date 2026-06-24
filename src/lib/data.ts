import { School, Exam } from './types'

export const subjectCategories = [
  { id: 'matematik', name: 'Matematik', emoji: '📐' },
  { id: 'sprak', name: 'Språk', emoji: '🗣️' },
  { id: 'naturvetenskap', name: 'Naturvetenskap', emoji: '🧪' },
  { id: 'samhalle', name: 'Samhälle', emoji: '🌍' },
  { id: 'historia', name: 'Historia', emoji: '📜' },
  { id: 'teknik', name: 'Teknik', emoji: '⚙️' },
]

export const schools: School[] = [
  {
    id: 'sch-1',
    name: 'Komvux Stockholm Södermalm',
    city: 'Stockholm',
    municipality: 'Stockholm',
    address: 'Medborgarplatsen 25',
    postalCode: '118 72',
    lat: 59.3138,
    lng: 18.0735,
    rating: 4.7,
    reviewCount: 312,
    phone: '08-508 350 00',
    email: 'kontakt@komvux-sodermalm.stockholm.se',
    website: 'https://komvux-sodermalm.stockholm.se',
    description: 'Komvux Stockholm Södermalm är en av Stockholms största vuxenutbildningar med lång erfarenhet av prövningar inom de flesta gymnasieämnen. Vi erbjuder flexibla tider och erfarna examinatorer.',
    type: 'komvux',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
    subjects: ['Matematik', 'Svenska', 'Engelska', 'Fysik', 'Kemi'],
    certifications: ['Skolverket-godkänd', 'ISO 9001'],
    established: 1995,
    studentCount: 4200,
    successRate: 89,
  },
  {
    id: 'sch-2',
    name: 'Hermods Distans',
    city: 'Stockholm',
    municipality: 'Stockholm',
    address: 'Sveavägen 168',
    postalCode: '113 46',
    lat: 59.3434,
    lng: 18.0512,
    rating: 4.5,
    reviewCount: 891,
    phone: '0771-21 70 00',
    email: 'info@hermods.se',
    website: 'https://www.hermods.se',
    description: 'Hermods har över 100 års erfarenhet av utbildning och erbjuder prövningar på distans och på plats i hela Sverige. Marknadsledande inom flexibel vuxenutbildning.',
    type: 'privat',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    subjects: ['Matematik', 'Svenska', 'Engelska', 'Samhällskunskap', 'Historia'],
    certifications: ['Skolverket-godkänd'],
    established: 1898,
    studentCount: 12000,
    successRate: 91,
  },
  {
    id: 'sch-3',
    name: 'Medborgarskolan Stockholm',
    city: 'Stockholm',
    municipality: 'Stockholm',
    address: 'Kungsgatan 16',
    postalCode: '111 35',
    lat: 59.3346,
    lng: 18.0632,
    rating: 4.6,
    reviewCount: 204,
    phone: '08-587 88 200',
    email: 'stockholm@medborgarskolan.se',
    website: 'https://www.medborgarskolan.se',
    description: 'Medborgarskolan erbjuder prövningar i en lugn och stödjande miljö med fokus på din individuella utveckling.',
    type: 'privat',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
    subjects: ['Matematik', 'Engelska', 'Biologi', 'Kemi'],
    certifications: ['Skolverket-godkänd'],
    established: 1940,
    studentCount: 3100,
    successRate: 87,
  },
  {
    id: 'sch-4',
    name: 'Komvux Göteborg',
    city: 'Göteborg',
    municipality: 'Göteborg',
    address: 'Sten Sturegatan 12',
    postalCode: '411 38',
    lat: 57.7072,
    lng: 11.9668,
    rating: 4.4,
    reviewCount: 456,
    phone: '031-365 00 00',
    email: 'komvux@goteborg.se',
    website: 'https://www.goteborg.se/komvux',
    description: 'Göteborgs största komvux med ett brett utbud av prövningar i alla kärnämnen och yrkesämnen.',
    type: 'komvux',
    imageUrl: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80',
    subjects: ['Matematik', 'Svenska', 'Engelska', 'Fysik', 'Naturkunskap'],
    certifications: ['Skolverket-godkänd'],
    established: 1988,
    studentCount: 5600,
    successRate: 85,
  },
  {
    id: 'sch-5',
    name: 'Komvux Malmö Borgmästaregården',
    city: 'Malmö',
    municipality: 'Malmö',
    address: 'Borgmästaregatan 1',
    postalCode: '211 31',
    lat: 55.5953,
    lng: 12.9963,
    rating: 4.3,
    reviewCount: 278,
    phone: '040-34 10 00',
    email: 'komvux@malmo.se',
    website: 'https://malmo.se/komvux',
    description: 'Komvux Malmö erbjuder prövningar för dig som vill höja dina betyg snabbt och effektivt.',
    type: 'komvux',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
    subjects: ['Matematik', 'Svenska', 'Samhällskunskap', 'Historia'],
    certifications: ['Skolverket-godkänd'],
    established: 1992,
    studentCount: 4800,
    successRate: 83,
  },
  {
    id: 'sch-6',
    name: 'Uppsala Komvux',
    city: 'Uppsala',
    municipality: 'Uppsala',
    address: 'Stationsgatan 12',
    postalCode: '753 40',
    lat: 59.8586,
    lng: 17.6389,
    rating: 4.5,
    reviewCount: 198,
    phone: '018-727 00 00',
    email: 'komvux@uppsala.se',
    website: 'https://www.uppsala.se/komvux',
    description: 'Uppsala Komvux har ett starkt fokus på naturvetenskapliga prövningar med moderna laborationssalar.',
    type: 'komvux',
    imageUrl: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=800&q=80',
    subjects: ['Fysik', 'Kemi', 'Biologi', 'Matematik'],
    certifications: ['Skolverket-godkänd'],
    established: 1985,
    studentCount: 2900,
    successRate: 90,
  },
  {
    id: 'sch-7',
    name: 'NTI Gymnasiet Linköping',
    city: 'Linköping',
    municipality: 'Linköping',
    address: 'Industrigatan 2',
    postalCode: '582 73',
    lat: 58.4108,
    lng: 15.6214,
    rating: 4.6,
    reviewCount: 134,
    phone: '013-470 00 00',
    email: 'linkoping@nti.se',
    website: 'https://www.ntigymnasiet.se',
    description: 'NTI erbjuder teknik- och naturvetenskapliga prövningar med fokus på praktisk tillämpning.',
    type: 'privat',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
    subjects: ['Matematik', 'Fysik', 'Teknik', 'Programmering'],
    certifications: ['Skolverket-godkänd'],
    established: 2001,
    studentCount: 1800,
    successRate: 88,
  },
  {
    id: 'sch-8',
    name: 'Komvux Örebro',
    city: 'Örebro',
    municipality: 'Örebro',
    address: 'Fabriksgatan 8',
    postalCode: '703 60',
    lat: 59.2753,
    lng: 15.2134,
    rating: 4.2,
    reviewCount: 167,
    phone: '019-21 10 00',
    email: 'komvux@orebro.se',
    website: 'https://www.orebro.se/komvux',
    description: 'Komvux Örebro erbjuder kvällskurser och prövningar för dig som arbetar samtidigt som du studerar.',
    type: 'komvux',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    subjects: ['Svenska', 'Engelska', 'Matematik', 'Religionskunskap'],
    certifications: ['Skolverket-godkänd'],
    established: 1990,
    studentCount: 2400,
    successRate: 84,
  },
  {
    id: 'sch-9',
    name: 'Västerås Komvux',
    city: 'Västerås',
    municipality: 'Västerås',
    address: 'Vasagatan 18',
    postalCode: '722 15',
    lat: 59.6099,
    lng: 16.5448,
    rating: 4.4,
    reviewCount: 145,
    phone: '021-39 00 00',
    email: 'komvux@vasteras.se',
    website: 'https://www.vasteras.se/komvux',
    description: 'Västerås Komvux erbjuder ett brett utbud av prövningar med personlig handledning.',
    type: 'komvux',
    imageUrl: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800&q=80',
    subjects: ['Matematik', 'Svenska', 'Engelska', 'Geografi'],
    certifications: ['Skolverket-godkänd'],
    established: 1993,
    studentCount: 2100,
    successRate: 86,
  },
  {
    id: 'sch-10',
    name: 'Plusgymnasiet Helsingborg',
    city: 'Helsingborg',
    municipality: 'Helsingborg',
    address: 'Drottninggatan 14',
    postalCode: '252 21',
    lat: 56.0465,
    lng: 12.6945,
    rating: 4.7,
    reviewCount: 98,
    phone: '042-12 00 00',
    email: 'helsingborg@plusgymnasiet.se',
    website: 'https://www.plusgymnasiet.se',
    description: 'Plusgymnasiet erbjuder personlig coachning och prövningar i mindre grupper för bästa resultat.',
    type: 'privat',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
    subjects: ['Matematik', 'Svenska', 'Engelska', 'Samhällskunskap'],
    certifications: ['Skolverket-godkänd'],
    established: 2005,
    studentCount: 1200,
    successRate: 92,
  },
]

let examIdCounter = 1
function nextExamId() {
  return `exam-${examIdCounter++}`
}

const courses: { subject: string; course: string; courseCode: string; level: Exam['level']; points: number }[] = [
  { subject: 'Matematik', course: 'Matematik 1b', courseCode: 'MATMAT01b', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Matematik', course: 'Matematik 2b', courseCode: 'MATMAT02b', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Matematik', course: 'Matematik 3b', courseCode: 'MATMAT03b', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Matematik', course: 'Matematik 3c', courseCode: 'MATMAT03c', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Matematik', course: 'Matematik 4', courseCode: 'MATMAT04', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Matematik', course: 'Matematik 5', courseCode: 'MATMAT05', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Svenska', course: 'Svenska 1', courseCode: 'SVESVE01', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Svenska', course: 'Svenska 2', courseCode: 'SVESVE02', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Svenska', course: 'Svenska 3', courseCode: 'SVESVE03', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Engelska', course: 'Engelska 5', courseCode: 'ENGENG05', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Engelska', course: 'Engelska 6', courseCode: 'ENGENG06', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Engelska', course: 'Engelska 7', courseCode: 'ENGENG07', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Fysik', course: 'Fysik 1a', courseCode: 'FYSFYS01a', level: 'Gymnasiekurs', points: 150 },
  { subject: 'Fysik', course: 'Fysik 2', courseCode: 'FYSFYS02', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Kemi', course: 'Kemi 1', courseCode: 'KEMKEM01', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Kemi', course: 'Kemi 2', courseCode: 'KEMKEM02', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Biologi', course: 'Biologi 1', courseCode: 'BIOBIO01', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Biologi', course: 'Biologi 2', courseCode: 'BIOBIO02', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Historia', course: 'Historia 1a1', courseCode: 'HISHIS01a1', level: 'Gymnasiekurs', points: 50 },
  { subject: 'Samhällskunskap', course: 'Samhällskunskap 1b', courseCode: 'SAMSAM01b', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Naturkunskap', course: 'Naturkunskap 1b', courseCode: 'NAKNAK01b', level: 'Gymnasiekurs', points: 100 },
  { subject: 'Religionskunskap', course: 'Religionskunskap 1', courseCode: 'RELREL01', level: 'Gymnasiekurs', points: 50 },
  { subject: 'Geografi', course: 'Geografi 1', courseCode: 'GEOGEO01', level: 'Gymnasiekurs', points: 100 },
]

const examiners = ['Anna Lindqvist', 'Mikael Svensson', 'Sara Bergström', 'Johan Karlsson', 'Lena Holm', 'Erik Nilsson', 'Maria Persson', 'Peter Åkerlund']

const baseDates2026 = [
  '2026-07-02', '2026-07-09', '2026-07-16', '2026-07-23',
  '2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25',
  '2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22',
]

export const exams: Exam[] = []

schools.forEach((school, schoolIndex) => {
  const numExams = 4 + (schoolIndex % 3)
  for (let i = 0; i < numExams; i++) {
    const courseIndex = (schoolIndex * 3 + i) % courses.length
    const c = courses[courseIndex]
    const id = nextExamId()
    const dateIndex = (schoolIndex + i) % baseDates2026.length
    const date = baseDates2026[dateIndex]
    const totalSpots = 8 + (i % 4) * 4
    const spotsTaken = (schoolIndex * 2 + i * 3) % (totalSpots + 1)
    const spotsRemaining = Math.max(0, totalSpots - spotsTaken)

    exams.push({
      id,
      schoolId: school.id,
      subject: c.subject,
      course: c.course,
      courseCode: c.courseCode,
      level: c.level,
      points: c.points,
      date,
      time: i % 2 === 0 ? '09:00' : '13:00',
      duration: c.subject === 'Matematik' || c.subject === 'Fysik' ? 180 : 120,
      location: school.city,
      room: `Sal ${100 + i}`,
      availableSpots: spotsRemaining,
      totalSpots,
      price: school.type === 'komvux' ? 0 : 300 + (i % 3) * 100,
      registrationDeadline: date,
      description: `Prövning i ${c.course} enligt Skolverkets kursplan. Provet testar dina kunskaper genom skriftliga och i förekommande fall muntliga moment.`,
      requirements: ['Giltig ID-handling', 'Egen miniräknare (ej grafritande om ej tillåtet)', 'Pennor och suddgummi'],
      materials: ['Formelblad tillhandahålls', 'Skrivpapper tillhandahålls'],
      examiner: examiners[(schoolIndex + i) % examiners.length],
      isPopular: spotsRemaining < totalSpots * 0.3,
      tags: spotsRemaining === 0 ? ['Fullbokad'] : spotsRemaining < 3 ? ['Få platser kvar'] : [],
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z',
    })
  }
})

export function getSchoolById(id: string): School | undefined {
  return schools.find((s) => s.id === id)
}

export function getExamById(id: string): Exam | undefined {
  return exams.find((e) => e.id === id)
}

export function getExamsBySchool(schoolId: string): Exam[] {
  return exams.filter((e) => e.schoolId === schoolId)
}

export function getExamWithSchool(id: string): Exam | undefined {
  const exam = getExamById(id)
  if (!exam) return undefined
  return { ...exam, school: getSchoolById(exam.schoolId) }
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
