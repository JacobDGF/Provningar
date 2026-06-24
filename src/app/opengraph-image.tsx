import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #1e3a8a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"
                stroke="white"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M22 10v6" stroke="white" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"
                stroke="white"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: 'white' }}>
            Prövnings<span style={{ color: '#bfdbfe' }}>guiden</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#dbeafe', fontWeight: 500 }}>
          Hitta och boka prövningar i hela Sverige
        </div>
      </div>
    ),
    { ...size }
  )
}
