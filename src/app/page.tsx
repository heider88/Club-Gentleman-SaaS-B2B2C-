import { createClient } from "@/lib/supabase/server"
import { Star, MapPin, Clock, Instagram, Facebook, ChevronUp } from "lucide-react"
import BookingWizard from "@/components/booking/BookingWizard"
import BarbersList from "@/components/home/BarbersList"
import { GallerySection } from "@/components/home/GallerySection"
import Image from "next/image"

// Revalidar caché de la Landing Page cada 1 hora (3600 segundos) automáticamente,
// y también de forma inmediata cuando el Admin suba una foto desde el panel.
export const revalidate = 3600;

export default async function LandingPage() {
  const supabase = await createClient()

  // 1. Fetch de imágenes dinámicas generadas por el Administrador (con caché)
  const { data: galleryImages } = await supabase
      .from('gallery_images')
      .select('image_url')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10)

  const fallbackImages = [
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop",
  ]

  const initialPhotos = galleryImages && galleryImages.length > 0 
      ? galleryImages.map(g => g.image_url) 
      : fallbackImages;

  // Fetch Barbers
  const { data: barbersData } = await supabase
      .from('profiles')
      .select('id, full_name, bio, avatar_url, specialty')
      .eq('role', 'barber')
      .order('created_at', { ascending: true })

  const barbers = barbersData || [];

  // Fetch Services
  const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .order('name')

  const services = servicesData || [];

  return (
    <>
      {/* Fondo Fijo Degradado Restaurado */}
      <div className="fixed inset-0 bg-gradient-to-r from-black to-[#6D3294] -z-20 pointer-events-none" />
      
      {/* Noise background ligero en lugar de feTurbulence SVG pesado */}
      <div className="fixed inset-0 opacity-[0.03] mix-blend-overlay -z-10 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABXRSTlMNDxESFjk7Z3EAAAA/SURBVDjLpc0xDQAwDMOg0i69r1gJtN1o8wI4y8y+tO99n/mQ14e8PuT1Ia8PeX3I60NeH/L6kNeHvD7k9aG3DyHwBf3zT0nLAAAAAElFTkSuQmCC')] bg-repeat" />

      <main className="min-h-[100dvh] relative overflow-hidden pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))]">

        {/* Header Section */}
      <header className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-10 pb-4 relative z-10">
        <div className="flex flex-col items-center gap-6 border-b border-white/[0.08] pb-12 relative">
          {/* Sombra de luz para el header */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-1/2 bg-[#6D3294]/10 blur-[100px] pointer-events-none -z-10" />
          <div className="space-y-6 flex flex-col items-center text-center">
            {/* Logo Centrado (Incrementado 15%) */}
            <div className="relative w-[87vw] sm:w-[52rem] aspect-[2/1] max-w-full drop-shadow-2xl -mt-4">
              <Image
                src="/lojito.webp"
                alt="Club Gentleman For Men Logo"
                fill
                className="object-contain object-center scale-[2.2] sm:scale-125"
                priority
              />
            </div>
            <h1 className="sr-only">Club Gentleman For Men</h1>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/80 font-medium">
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

          <div className="flex flex-col items-center gap-4 w-full sm:w-auto mt-4">
            <span className="bg-black/40 backdrop-blur-xl border border-white/10 border-t-white/20 text-white/90 text-xs font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              Barbería
            </span>
            <div className="flex justify-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100065179103783"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-white/5 border-t-white/10 bg-black/40 backdrop-blur-xl rounded-full hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 transition-all text-white/60 hover:text-white hover:shadow-[0_0_20px_rgba(24,119,242,0.3)] active:scale-95"
                title="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/club_gentlemanbarber?igsh=cGcwd3F0YXEzb2hl&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center border border-white/5 border-t-white/10 bg-black/40 backdrop-blur-xl rounded-full hover:border-pink-500/50 transition-all text-white/60 hover:text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] group active:scale-95 overflow-hidden relative"
                title="Instagram"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-yellow-400/20 via-pink-500/20 to-purple-500/20 transition-opacity" />
                <Instagram className="w-5 h-5 relative z-10" />
              </a>
            </div>
          </div>
        </div>


      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-16 relative z-10 w-full">

        {/* Content Centrado */}
        <div className="w-full max-w-4xl mx-auto space-y-12">

          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-white/90 uppercase tracking-widest relative z-10">
              <span className="absolute -top-12 -left-10 text-[120px] text-white/[0.03] select-none pointer-events-none tracking-tighter hidden md:block">01</span>
              Sobre Nosotros
            </h2>
            <div>
              <span className="inline-block border border-white/10 border-t-white/20 bg-black/40 backdrop-blur-xl text-white/80 text-[10px] font-black px-4 py-2 rounded-full mb-8 tracking-[0.2em] uppercase shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative z-10">
                La Experiencia
              </span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-10 md:gap-16">
              {/* Drop Cap & Intro */}
              <div className="text-white/70 text-lg leading-relaxed font-medium md:w-1/2">
                <p className="first-letter:text-7xl first-letter:font-oswald first-letter:text-[#6D3294] first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] first-line:uppercase first-line:tracking-widest">
                  GENTLEMAN | Barbería & Club para Hombres con más de 7 años de experiencia.
                  No somos solo una barbería. En GENTLEMAN, cada visita es una experiencia inmersiva.
                  Aquí, los cortes de alta precisión se combinan con un espacio pensado para el hombre moderno.
                </p>
              </div>

              {/* List & Pull Quote */}
              <div className="md:w-1/2 border-l border-white/[0.05] pl-0 md:pl-10 space-y-8 flex flex-col justify-center">
                <div>
                  <p className="text-white/50 text-sm uppercase tracking-widest font-bold mb-4">Descubrí nuestra selección:</p>
                  <ul className="space-y-3 text-white/80 font-medium text-[15px]">
                    <li className="flex items-center gap-3"><span className="w-8 h-px bg-pink-500/50"></span> Productos de cuidado masculino</li>
                    <li className="flex items-center gap-3"><span className="w-8 h-px bg-pink-500/50"></span> Camisetas, gorras, relojes y joyas</li>
                    <li className="flex items-center gap-3"><span className="w-8 h-px bg-pink-500/50"></span> Ceras, aceites, fragancias exclusivas</li>
                  </ul>
                </div>
                
                <blockquote className="border-l-2 border-pink-500 pl-6 py-2">
                  <p className="text-xl md:text-2xl font-oswald text-white/90 italic tracking-wide">
                    "Esto no es solo un lugar para cortarte el cabello. Es donde comienza el camino del caballero."
                  </p>
                </blockquote>
              </div>
            </div>
          </div>

          <hr className="border-white/[0.05]" />

          {/* Booking Flow */}
          <div className="relative mt-12 scroll-mt-32" id="booking-section">
            {/* Glow del formulario */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#6D3294]/5 blur-[120px] pointer-events-none -z-10" />
            
            <div className="backdrop-blur-xl bg-black/40 border border-white/5 border-t-white/10 text-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-full max-w-screen-xl mx-auto relative overflow-hidden">
              {/* Highlight superior sutil */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <h2 className="text-2xl md:text-3xl font-black text-white mb-8 tracking-wide">Reserva tu cita</h2>
              <BookingWizard barbers={barbers} services={services} />
            </div>
          </div>
        </div>

        {/* Team Section */}
        <BarbersList barbers={barbers} />

        {/* Location Section */}
        <section id="ubicacion" className="w-full max-w-screen-xl mx-auto pt-20 relative">
          <span className="absolute -top-6 right-0 text-[100px] text-white/[0.03] font-oswald select-none pointer-events-none tracking-tighter hidden md:block text-right">FIND US</span>
          
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12 relative z-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-white/90 uppercase tracking-widest">Ubicación</h2>
              <div className="w-20 h-1 bg-[#6D3294] mt-6"></div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center bg-black/40 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Sutil glow de ubicación */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/5 blur-[100px] pointer-events-none -z-10" />
            
            <div className="flex-1 space-y-4 text-white/70">
              <p className="text-lg leading-relaxed">Nos encontramos ubicados en una zona central de fácil acceso para brindarte la mejor atención y comodidad.</p>
              <p className="text-2xl md:text-3xl font-black text-white/90">Cll 72 sur #14-80 Bogotá</p>
              <a
                href="https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6D3294] hover:text-pink-400 font-bold hover:underline transition-colors mt-4 inline-flex items-center gap-2 group"
              >
                Ver dirección en G. Maps 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>

            {/* Map Image (Clickable) */}
            <a
              href="https://maps.app.goo.gl/bfDpJrCcxnpkGfBX7"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-[400px] h-64 bg-black/80 rounded-2xl overflow-hidden relative grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:shadow-[0_0_40px_rgba(109,50,148,0.3)] transition-all duration-700 border border-white/10 group cursor-pointer block"
            >
              <Image
                src="/shop.webp"
                alt="Fachada Club Gentleman For Men"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
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
        <GallerySection initialPhotos={initialPhotos} />
      </div>

      {/* Monolithic Footer */}
      <footer className="relative w-full bg-black border-t border-white/[0.05] overflow-hidden pt-20 pb-8 flex flex-col items-center">
        {/* Sutil brillo superior de neón */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#6D3294]/50 to-transparent" />
        
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 mb-16 relative z-10">
          <p className="font-mono text-white/30 text-xs tracking-[0.3em] uppercase">Est. 2018 © Todos los derechos reservados</p>
          <a href="#" className="font-oswald text-white/50 hover:text-white uppercase tracking-[0.2em] text-sm flex items-center gap-2 transition-colors border border-white/10 hover:border-white/30 px-6 py-2 rounded-full">
            <ChevronUp className="w-4 h-4" /> Volver Arriba
          </a>
        </div>

        {/* Typographic Monument */}
        <div className="w-full text-center relative z-10 px-4">
          <h2 className="font-oswald font-black leading-none text-[15vw] tracking-tighter text-transparent" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.08)' }}>
            GENTLEMAN
          </h2>
        </div>
        
        {/* Glow de fondo para el texto */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-[#6D3294]/20 blur-[120px] pointer-events-none -z-0" />
      </footer>
    </main>
    </>
  )
}
