"use client"

import { useState } from "react"
import { Upload, Trash2, Link as LinkIcon, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { addGalleryImage, deleteGalleryImage, uploadGalleryImageDirect } from "@/app/actions/gallery"

import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'

export function GalleryManager({ initialImages }: { initialImages: any[] }) {
    const [images, setImages] = useState(initialImages)
    const [isUploading, setIsUploading] = useState(false)
    const [externalUrl, setExternalUrl] = useState("")
    const router = useRouter()
    
    // Método 1: URL Externa (Rápido)
    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!externalUrl) return
        
        setIsUploading(true)
        const res = await addGalleryImage(externalUrl)
        
        if (res?.error) {
            toast.error("Error al añadir imagen", { description: res.error })
        } else {
            toast.success("Imagen añadida a la galería")
            setExternalUrl("")
            // Usamos router.refresh en vez de window.location para no perder el prefetching de Next.js
            router.refresh()
        }
        setIsUploading(false)
    }

    // Método 2: Subida Directa de Archivo (Supabase Storage vía Server Action)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            return toast.error("Solo se permiten archivos de imagen.")
        }
        if (file.size > 5 * 1024 * 1024) {
            return toast.error("La imagen es muy pesada. Máximo 5MB.")
        }

        setIsUploading(true)
        const toastId = toast.loading("Comprimiendo y subiendo imagen...")

        try {
            // Compress image to save storage and bandwidth
            const options = {
                maxSizeMB: 0.5, // 500KB max for gallery to preserve decent quality
                maxWidthOrHeight: 1200, 
                useWebWorker: true
            }
            const compressedFile = await imageCompression(file, options)

            const formData = new FormData();
            formData.append('file', compressedFile, file.name);

            const res = await uploadGalleryImageDirect(formData);
            
            if (res?.error) throw new Error(res.error)

            toast.success("¡Imagen publicada en la página web!", { id: toastId })
            router.refresh()
        }  
    catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Error al subir la imagen", { id: toastId })
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!window.confirm("¿Estás seguro de quitar esta foto de tu página web?")) return

        const toastId = toast.loading("Eliminando...")
        const res = await deleteGalleryImage(id, imageUrl)

        if (res?.error) {
            toast.error("Error al eliminar", { id: toastId, description: res.error })
        } else {
            toast.success("Foto eliminada de la galería", { id: toastId })
            setImages(images.filter(img => img.id !== id))
        }
    }

    return (
        <div className="space-y-8">
            {/* Controles de Subida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Opción 1: Subir Archivo Físico */}
                <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center justify-center text-center h-full min-h-[160px] border-2 border-dashed border-white/20 rounded-2xl hover:border-primary/50 transition-colors">
                        <Upload className="w-8 h-8 text-white/50 mb-3 group-hover:text-primary transition-colors" />
                        <h3 className="text-white font-bold mb-1">Subir Foto Nueva</h3>
                        <p className="text-xs text-white/50 mb-4">PNG, JPG hasta 5MB</p>
                        
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Opción 2: Pegar URL */}
                <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-center">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary" /> O pegar enlace de imagen
                    </h3>
                    <form onSubmit={handleAddUrl} className="flex gap-2">
                        <input 
                            type="url"
                            required
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            placeholder="https://ejemplo.com/foto.jpg"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none"
                            disabled={isUploading}
                        />
                        <button 
                            type="submit"
                            disabled={isUploading || !externalUrl}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            Añadir
                        </button>
                    </form>
                    <p className="text-xs text-white/40 mt-3">Útil si ya tienes fotos subidas en Unsplash, Imgur o Instagram.</p>
                </div>
            </div>

            {/* Cuadrícula de Galería */}
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Fotos en la Página Principal ({images.length})
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl bg-black/20">
                            La galería pública está vacía. ¡Sube tu primera foto!
                        </div>
                    ) : (
                        images.map((img) => (
                            <div key={img.id} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 group bg-black/40">
                                <Image
                                    src={img.image_url}
                                    alt="Foto de galería"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <button 
                                        onClick={() => handleDelete(img.id, img.image_url)}
                                        className="w-full flex items-center justify-center gap-2 bg-destructive/80 hover:bg-destructive text-white text-xs font-bold py-2 rounded-lg backdrop-blur-md transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Quitar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}