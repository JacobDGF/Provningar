import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { SavedExamsProvider } from '@/context/SavedExamsContext'
import { LocationProvider } from '@/context/LocationContext'
import { BookingsProvider } from '@/context/BookingsContext'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.provningsguiden.se'),
  title: {
    default: 'Prövningsguiden – Hitta och boka prövningar i hela Sverige',
    template: '%s | Prövningsguiden',
  },
  description:
    'Prövningsguiden hjälper tusentals studenter att hitta, jämföra och boka prövningar för att höja sina betyg och komma in på drömutbildningen. Sök bland skolor i hela Sverige, se lediga platser i realtid och boka direkt.',
  keywords: [
    'prövning',
    'pröva betyg',
    'höja betyg',
    'komvux prövning',
    'prövningsguiden',
    'boka prövning',
  ],
  authors: [{ name: 'Prövningsguiden' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: 'https://www.provningsguiden.se',
    siteName: 'Prövningsguiden',
    title: 'Prövningsguiden – Hitta och boka prövningar i hela Sverige',
    description:
      'Hitta, jämföra och boka prövningar för att höja dina betyg. Realtidstillgänglighet och skolor nära dig.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prövningsguiden – Hitta och boka prövningar i hela Sverige',
    description: 'Hitta, jämföra och boka prövningar för att höja dina betyg.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Prövningsguiden',
      url: 'https://www.provningsguiden.se',
      logo: 'https://www.provningsguiden.se/icon',
      description: 'Sveriges samlingsplats för att hitta, jämföra och boka prövningar.',
    },
    {
      '@type': 'WebSite',
      name: 'Prövningsguiden',
      url: 'https://www.provningsguiden.se',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.provningsguiden.se/upptack?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LocationProvider>
          <SavedExamsProvider>
            <BookingsProvider>
              <Header />
              <main className="pb-20 md:pb-0">{children}</main>
              <BottomNav />
            </BookingsProvider>
          </SavedExamsProvider>
        </LocationProvider>
      </body>
    </html>
  )
}
