"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-black text-white font-sans antialiased min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow de fondo para mantener la identidad visual */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-1/2 bg-[#6D3294]/20 blur-[120px] pointer-events-none -z-10" />
        
        <div className="relative w-40 h-20 mb-8 opacity-80">
          <Image
            src="/scissors-logo.svg"
            alt="Club Gentleman"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white/90 mb-4 text-center">
          Algo Salió Mal
        </h1>
        <p className="text-white/50 text-sm md:text-base font-medium max-w-md text-center mb-10 px-6 leading-relaxed">
          Hemos detectado un problema técnico. Nuestro equipo ya ha sido notificado. Por favor, intenta de nuevo o vuelve al inicio.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white text-xs font-bold px-8 py-3 rounded-full uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(123,44,191,0.3)] hover:shadow-[0_0_30px_rgba(157,78,221,0.5)]"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-8 py-3 rounded-full uppercase tracking-widest transition-all"
          >
            Ir al Inicio
          </a>
        </div>
      </body>
    </html>
  );
}
