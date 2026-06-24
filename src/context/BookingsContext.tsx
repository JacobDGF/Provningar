'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Booking, BookingPersonalInfo } from '@/lib/types'

interface BookingsContextValue {
  bookings: Booking[]
  createBooking: (examId: string, schoolId: string, personalInfo: BookingPersonalInfo) => Booking
  getBooking: (id: string) => Booking | undefined
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined)

const STORAGE_KEY = 'provningsguiden_bookings'

function generateReference(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(10000 + Math.random() * 90000)
  return `PRV-${year}-${random}`
}

function generateId(): string {
  return `booking-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setBookings(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  }, [bookings, mounted])

  function createBooking(examId: string, schoolId: string, personalInfo: BookingPersonalInfo): Booking {
    const booking: Booking = {
      id: generateId(),
      referenceNumber: generateReference(),
      examId,
      schoolId,
      personalInfo,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setBookings((prev) => [...prev, booking])
    return booking
  }

  function getBooking(id: string) {
    return bookings.find((b) => b.id === id)
  }

  return (
    <BookingsContext.Provider value={{ bookings, createBooking, getBooking }}>
      {children}
    </BookingsContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
