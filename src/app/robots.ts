import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/boka/', '/bekraftelse/', '/bokningar'],
    },
    sitemap: 'https://www.provningsguiden.se/sitemap.xml',
  }
}
