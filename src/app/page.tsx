"use client"

import { useState } from "react"
import { Star, MapPin, Clock, Instagram, Facebook, Share, ChevronUp } from "lucide-react"
import BookingWizard from "@/components/booking/BookingWizard"
import BarbersList from "@/components/home/BarbersList"
import Image from "next/image"

export default function LandingPage() {
  const [showPortfolio, setShowPortfolio] = useState(true)

  // Imágenes comprobadas estrictamente como funcionales para llenar la galería
  const portfolioImages = [
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=400&fit=crop",
    // Duplicadas dinámicas temporales para cerrar la cuadrícula perfectamernte
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop",
  ]

  return (
    // Hereda Layout Background, con safeties bottom
    <main className="min-h-[100dvh] relative overflow-hidden pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))]">

      {/* Header Section */}
      <header className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 pb-4 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/20 pb-6">
          <div className="space-y-4">
            {/* Duplicando el tamaño del logo (antes w-48 h-24 sm:w-56 sm:h-28) */}
            <div className="relative w-96 h-48 sm:w-[28rem] sm:h-56 -ml-2 drop-shadow-2xl">
              <Image
                src="/logo.png"
                alt="Club Gentleman For Men Logo"
                fill
                className="object-contain object-left scale-110 origin-left"
                priority
              />
            </div>
            <h1 className="sr-only">Club Gentleman For Men</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80 font-medium">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-white">5.0 <span className="text-white/60 font-normal">(341 reviews)</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Cll 72 sur #14-80 . Bogotá</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold">Open now</span>
                <span>09:00 - 20:00</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Barbería
            </span>
            <div className="flex gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=100065179103783"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center border border-white/20 bg-white/5 backdrop-blur-md rounded-full hover:bg-[#1877F2] hover:border-[#1877F2] transition-all text-white/80 hover:text-white active:scale-95"
                title="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/club_gentlemanbarber?igsh=cGcwd3F0YXEzb2hl&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center border border-white/20 bg-white/5 backdrop-blur-md rounded-full hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:border-transparent transition-all text-white/80 hover:text-white active:scale-95"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>


      </header>

      {/* Main Content Area */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-16 relative z-10 w-full">

        {/* Content Centrado */}
        <div className="w-full max-w-4xl mx-auto space-y-12">

          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white uppercase tracking-wider">Sobre Nosotros</h2>
            <div>
              <span className="inline-block border border-white/20 bg-white/5 backdrop-blur-md text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                Barbería
              </span>
            </div>

            <div className="text-white/80 space-y-4 text-[15px] leading-relaxed max-w-2xl font-medium">
              <p>
                <strong className="text-white">GENTLEMAN | Barbería & Club</strong> para Hombres con más de 7 años de experiencia.
                No somos solo una barbería. En GENTLEMAN, cada visita es una experiencia.
                Aquí, los cortes de alta precisión se combinan con un espacio pensado para el hombre moderno: un club donde el estilo, el cuidado personal y la actitud se encuentran.
              </p>

              <p>Descubrí nuestra selección de artículos para hombres:</p>
              <ul className="list-disc pl-6 space-y-1 text-white/90">
                <li>Productos de cuidado masculino</li>
                <li>Camisetas, gorras, relojes y joyas</li>
                <li>Ceras, aceites, fragancias exclusivas</li>
              </ul>

              <p>Esto no es solo un lugar para cortarte el cabello. Es donde comienza el camino del caballero.</p>

              <p className="font-bold text-white pt-2">GENTLEMAN - Más que estilo, una actitud de caballeros.</p>
            </div>
          </div>

          <hr className="border-white/20" />

          {/* Booking Flow */}
          <div className="relative mt-8 scroll-mt-32" id="booking-section">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 text-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-screen-xl mx-auto">
              <h2 className="text-2xl font-black text-white mb-6">Reserva tu cita</h2>
              <BookingWizard />
            </div>
          </div>
        </div>

        {/* Team Section */}
        <BarbersList />

        {/* Location Section */}
        <section id="ubicacion" className="w-full max-w-screen-xl mx-auto pt-10">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-pink-400 drop-shadow-md" />
            <h2 className="text-3xl font-black text-white uppercase tracking-wider">Ubicación</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="flex-1 space-y-4 text-white/80">
              <p className="text-lg">Nos encontramos ubicados en una zona central de fácil acceso para brindarte la mejor atención y comodidad.</p>
              <p className="text-2xl font-black text-white">Cll 72 sur #14-80 Bogotá</p>
              <a
                href="https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 font-bold hover:text-white hover:underline transition-colors mt-2 inline-flex items-center gap-2"
              >
                Ver dirección en G. Maps 📍
              </a>
            </div>

            {/* Map Image (Clickable) */}
            <a
              href="https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-[400px] h-64 bg-black/60 rounded-2xl overflow-hidden relative grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all duration-500 border border-white/10 group cursor-pointer block"
            >
              <Image
                src="/shop.jpg"
                alt="Fachada Club Gentleman For Men"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                unoptimized
              />

              {/* Etiqueta flotante al posar el mouse */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <span className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-6 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                  Abrir Mapa Directo
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="galeria" className="w-full pt-10 pb-20 scroll-mt-24">
          <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Image
                src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>"
                alt="Portfolio"
                width={28}
                height={28}
                className="drop-shadow-md"
              />
              <h2 className="text-3xl font-black text-white uppercase tracking-wider">Nuestro Trabajo</h2>
            </div>
            <button
              onClick={() => setShowPortfolio(!showPortfolio)}
              className="text-sm font-bold bg-white/5 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              {showPortfolio ? 'Ver menos' : 'Cargar más'}
              <ChevronUp className={`w-4 h-4 transition-transform ${showPortfolio ? '' : 'rotate-180'}`} />
            </button>
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 overflow-hidden transition-all duration-1000 ease-in-out ${showPortfolio ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {portfolioImages.map((src, i) => (
              <div key={i} className="aspect-square relative rounded-2xl overflow-hidden bg-black/20 border border-white/10 group cursor-pointer shadow-xl">
                <Image
                  src={src}
                  alt={`Portfolio item ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#6D3294]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <span className="text-white font-bold opacity-0 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                    Corte #{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
