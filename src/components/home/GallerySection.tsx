"use client"

import { useState } from "react"
import { ChevronUp } from "lucide-react"
import Image from "next/image"

export function GallerySection({ initialPhotos }: { initialPhotos: string[] }) {
    const [showPortfolio, setShowPortfolio] = useState(true)

    return (
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

          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 overflow-hidden transition-all duration-1000 ease-in-out ${showPortfolio ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {initialPhotos.map((src, i) => (
              <div key={i} className="aspect-square relative rounded-2xl overflow-hidden bg-black/20 border border-white/10 group cursor-pointer shadow-xl">
                <Image
                  src={src}
                  alt={`Trabajo de barbería ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#6D3294]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <span className="text-white font-bold opacity-0 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                    Trabajo #{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
    )
}
