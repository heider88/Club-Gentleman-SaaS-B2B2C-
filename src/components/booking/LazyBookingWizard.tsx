"use client"

import dynamic from "next/dynamic"

// Lazy load the heaviest component of the page to prevent scroll lag and hydration blocking
const BookingWizard = dynamic(() => import("@/components/booking/BookingWizard"), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center space-y-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="h-4 w-48 bg-white/10 rounded-full" />
      <div className="h-3 w-64 bg-white/5 rounded-full" />
    </div>
  )
})

interface LazyBookingWizardProps {
    barbers: any[];
    services: any[];
}

export function LazyBookingWizard({ barbers, services }: LazyBookingWizardProps) {
    return <BookingWizard barbers={barbers} services={services} />
}
