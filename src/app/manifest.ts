import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prövningsguiden – Hitta och boka prövningar',
    short_name: 'Prövningsguiden',
    description:
      'Hitta, jämför och boka prövningar för att höja dina betyg och komma in på drömutbildningen.',
    start_url: '/upptack',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    lang: 'sv',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
