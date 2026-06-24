import type { MetadataRoute } from 'next'
import { schools, exams } from '@/lib/data'

const BASE_URL = 'https://www.provningsguiden.se'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/upptack`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/om-oss`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const examRoutes: MetadataRoute.Sitemap = exams.map((exam) => ({
    url: `${BASE_URL}/provning/${exam.id}`,
    changeFrequency: 'hourly',
    priority: 0.8,
  }))

  const schoolRoutes: MetadataRoute.Sitemap = schools.map((school) => ({
    url: `${BASE_URL}/skola/${school.id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...examRoutes, ...schoolRoutes]
}
