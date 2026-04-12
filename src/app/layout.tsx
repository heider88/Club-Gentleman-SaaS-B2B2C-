import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { StaticHeader } from "@/components/layout/StaticHeader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Club Gentleman for Men",
    default: "Club Gentleman for Men | Barbería Premium",
  },
  description: "Barbería Premium, Cortes Clásicos o Urbanos y arreglo de barba. Agende su cita con nuestros profesionales de clase mundial.",
  keywords: ["Barbería", "Premium", "Corte de Cabello", "Club Gentleman", "Barba", "Agendar Cita"],
  openGraph: {
    title: "Club Gentleman for Men",
    description: "La mejor experiencia de barbería premium para ti. Agenda hoy mismo.",
    url: "https://clubgentleman.app",
    siteName: "Club Gentleman for Men",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Club Gentleman for Men | Barbería Premium",
    description: "Experiencia en cortes clásicos y arreglo de barba de primera clase.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white min-h-[100dvh] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]`}
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        <StaticHeader />
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
