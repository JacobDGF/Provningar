'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface LocationState {
  coords: { lat: number; lng: number } | null
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'
  error: string | null
  requestLocation: () => void
}

const LocationContext = createContext<LocationState | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState<LocationState['status']>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      setError('Din webbläsare stödjer inte platstjänster.')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
        setError(null)
      },
      (err) => {
        setStatus('denied')
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Du har nekat platstjänster. Aktivera dem i webbläsarens inställningar för att se prövningar nära dig.'
            : 'Kunde inte hämta din position just nu.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return (
    <LocationContext.Provider value={{ coords, status, error, requestLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}
