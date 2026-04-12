"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Instagram, Facebook } from "lucide-react"

export function StaticHeader() {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navItems = [
        {
            id: "barberos",
            label: "BARBEROS",
            href: "#equipo"
        },
        {
            id: "ubicacion",
            label: "UBICACIÓN",
            href: "#ubicacion"
        },
        {
            id: "galeria",
            label: "GALERÍA",
            href: "#galeria"
        },
        {
            id: "contacto",
            label: "CONTÁCTANOS",
            dropdown: [
                { name: "Instagram", href: "https://www.instagram.com/club_gentlemanbarber?igsh=cGcwd3F0YXEzb2hl&utm_source=qr", iconName: "instagram" },
                { name: "Facebook", href: "https://www.facebook.com/profile.php?id=100065179103783", iconName: "facebook" }
            ]
        }
    ]

    return (
        <div className={`w-full font-sans flex flex-col sticky top-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-[#111111]/75 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'bg-[#111111] border-b border-white/10 shadow-lg'}`}>

            {/* Encabezado Principal de Navegación */}
            <header className="flex items-center justify-between px-6 sm:px-12 py-4 lg:py-5 max-w-[1400px] mx-auto w-full relative z-10">

                {/* Izquierda: Logo de la barbería */}
                <Link
                    href="/"
                    className="flex items-center gap-4 group"
                    onClick={(e) => {
                        if (window.location.pathname === "/") {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                    }}
                >
                    <div className="relative w-24 h-12 lg:w-28 lg:h-14 overflow-hidden flex items-center justify-center">
                        <Image
                            src="/scissors-logo.svg"
                            alt="Logo Club Gentleman"
                            fill
                            className="object-contain scale-110 group-hover:scale-125 transition-transform duration-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-lg sm:text-xl lg:text-2xl tracking-tighter leading-none group-hover:text-[#6D3294] transition-colors duration-300">
                            CLUB GENTLEMAN
                        </span>
                        <span className="text-gray-400 text-[9px] lg:text-[11px] font-bold tracking-[0.25em] uppercase mt-0.5">
                            For Men
                        </span>
                    </div>
                </Link>

                {/* Centro: Menús Desplegables Relevantes */}
                <nav className="hidden lg:flex items-center gap-10">
                    {navItems.map((item) => (
                        <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={() => item.dropdown && setActiveDropdown(item.id)}
                            onMouseLeave={() => item.dropdown && setActiveDropdown(null)}
                        >
                            {item.href ? (
                                item.href.startsWith("#") ? (
                                    <a href={item.href} className="min-h-[44px] active:scale-95 flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-gray-300 hover:text-white transition-colors py-4 group">
                                        {item.label}
                                    </a>
                                ) : (
                                    <Link href={item.href} className="min-h-[44px] active:scale-95 flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-gray-300 hover:text-white transition-colors py-4 group">
                                        {item.label}
                                    </Link>
                                )
                            ) : (
                                <button className="min-h-[44px] active:scale-95 flex items-center gap-1.5 text-[13px] font-extrabold tracking-widest uppercase text-gray-300 hover:text-white transition-colors py-4 group">
                                    {item.label}
                                    <motion.div
                                        animate={{ rotate: activeDropdown === item.id ? 180 : 0 }}
                                        transition={{ duration: 0.25, ease: "anticipate" }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#6D3294] transition-colors" />
                                    </motion.div>
                                </button>
                            )}

                            {/* Dropdown Menu Integrado con Framer Motion */}
                            <AnimatePresence>
                                {activeDropdown === item.id && item.dropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute top-[80%] left-1/2 -translate-x-1/2 pt-2 w-64 z-50"
                                    >
                                        <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden py-3 backdrop-blur-2xl">
                                            {item.dropdown.map((sub: any, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={sub.href}
                                                    target={sub.iconName ? "_blank" : "_self"}
                                                    rel={sub.iconName ? "noopener noreferrer" : ""}
                                                    className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#6D3294]/20 hover:border-l-[3px] hover:border-[#6D3294] border-l-[3px] border-transparent transition-all"
                                                >
                                                    {sub.iconName === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                                                    {sub.iconName === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                {/* Derecha: Botón Reservar Ahora (Sustituyendo el "Empezar" / Sin login) */}
                <div className="shrink-0 ml-4">
                    <a
                        href="#booking-section"
                        className="bg-white min-h-[44px] active:scale-95 hover:bg-gray-200 text-[#111] text-[11px] sm:text-[13px] font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-full uppercase tracking-[0.15em] transition-all shadow-xl border-2 border-transparent hover:border-[#6D3294] hover:shadow-[0_0_20px_rgba(109,50,148,0.5)] flex items-center justify-center relative overflow-hidden group"
                    >
                        <span className="relative z-10">Reservar Ahora</span>
                        {/* Brillo de efecto al pasar cursor */}
                        <div className="absolute inset-0 bg-white/50 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out z-[0]"></div>
                    </a>
                </div>

            </header>
        </div>
    )
}
