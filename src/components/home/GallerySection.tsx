"use client"

import { useState } from "react"
import { ChevronUp } from "lucide-react"
import Image from "next/image"

export function GallerySection({ initialPhotos }: { initialPhotos: string[] }) {
    const [showPortfolio, setShowPortfolio] = useState(true)

    return (
        <section id="galeria" className="w-full pt-20 pb-20 scroll-mt-24 relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6">
          <span className="absolute top-10 right-10 text-[120px] text-white/[0.02] font-oswald select-none pointer-events-none tracking-tighter hidden md:block">ARCHIVE</span>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b-2 border-[#6D3294] pb-6 relative z-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-white/90 uppercase tracking-widest">Lookbook</h2>
              <p className="text-white/50 font-oswald tracking-[0.2em] mt-2 uppercase text-sm">Nuestro Archivo Visual</p>
            </div>
            <button
              onClick={() => setShowPortfolio(!showPortfolio)}
              className="mt-6 md:mt-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent hover:bg-white text-white hover:text-black border border-white/20 hover:border-white px-6 py-3 transition-all duration-300 flex items-center gap-3"
            >
              {showPortfolio ? 'Cerrar Archivo' : 'Explorar'}
              <ChevronUp className={`w-4 h-4 transition-transform duration-500 ${showPortfolio ? '' : 'rotate-180'}`} />
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2 overflow-hidden transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showPortfolio ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {initialPhotos.map((src, i) => {
              // Create irregular masonry-like pattern
              const isLarge = i % 5 === 0;
              const isWide = i % 7 === 0 && !isLarge;
              
              return (
                <div 
                  key={i} 
                  className={`relative overflow-hidden bg-black group cursor-pointer border border-white/[0.05] 
                  ${isLarge ? 'md:row-span-2 md:col-span-2 aspect-[3/4] md:aspect-[4/5]' : 
                    isWide ? 'md:col-span-2 aspect-video md:aspect-[21/9]' : 'aspect-square'}`}
                >
                  <Image
                    src={src}
                    alt={`Trabajo de barbería ${i + 1}`}
                    fill
                    className="object-cover grayscale opacity-60 group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[800ms] ease-out"
                    unoptimized
                  />
                  
                  {/* Brutalist Overlay Info */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <div>
                        <p className="text-[#6D3294] font-bold text-[10px] tracking-[0.3em] uppercase mb-1">GENTLEMAN CUT</p>
                        <h3 className="text-white font-oswald text-2xl uppercase tracking-wider leading-none">Style.{(i + 1).toString().padStart(2, '0')}</h3>
                      </div>
                      <span className="text-white/30 font-mono text-sm">2026</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
    )
}
