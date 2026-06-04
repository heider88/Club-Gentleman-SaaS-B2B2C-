"use client"

import { useState, useTransition } from "react"
import { GalleryManager } from "./GalleryManager"
import { saveSiteSettings, SiteSettingsPayload } from "@/app/actions/settings"
import { toast } from "sonner"
import { HelpCircle, Save, Plus, Trash2, GripVertical, Image as ImageIcon, Link as LinkIcon, Instagram, Facebook } from "lucide-react"

export function BusinessSettingsTabs({ 
    initialSettings, 
    initialImages 
}: { 
    initialSettings: SiteSettingsPayload, 
    initialImages: any[] 
}) {
    const [activeTab, setActiveTab] = useState("general")
    const [settings, setSettings] = useState<SiteSettingsPayload>(initialSettings)
    const [isPending, startTransition] = useTransition()

    const TABS = [
        { id: "nosotros", label: "Sobre Nosotros" },
        { id: "general", label: "General" },
        { id: "contacto", label: "Contacto y Redes" },
        { id: "secciones", label: "Secciones Adicionales" },
        { id: "horarios", label: "Horarios" },
        { id: "cartera", label: "Cartera" },
        { id: "galeria", label: "Galería" },
    ]

    const handleSave = () => {
        startTransition(async () => {
            const toastId = toast.loading("Guardando configuración...")
            const res = await saveSiteSettings(settings)
            
            if (res.success) {
                toast.success("Configuración guardada correctamente.", { id: toastId })
            } else {
                toast.error(res.error || "Error al guardar.", { id: toastId })
            }
        })
    }

    const renderGeneral = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <p className="text-sm text-dash-text-soft">Completa la información general de tu negocio para que los clientes puedan encontrarte fácilmente.</p>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Nombre*</label>
                    <input 
                        type="text" 
                        value={settings.general.name}
                        onChange={e => setSettings({...settings, general: {...settings.general, name: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ej: CLUB GENTLEMAN FOR MEN"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">País</label>
                        <select disabled className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white/50 outline-none appearance-none cursor-not-allowed">
                            <option>Colombia</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">Ciudad</label>
                        <select disabled className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white/50 outline-none appearance-none cursor-not-allowed">
                            <option>Bogotá</option>
                        </select>
                    </div>
                    <div className="space-y-2 relative">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-dash-text-soft mb-1">La zona horaria de tu sistema es: America/Bogota</span>
                            <label className="text-sm font-bold text-dash-text mb-2">Zona horaria</label>
                        </div>
                        <select disabled className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white/50 outline-none appearance-none cursor-not-allowed">
                            <option>América/Bogotá</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Dirección</label>
                    <input 
                        type="text" 
                        value={settings.contact.address || ''}
                        onChange={e => setSettings({...settings, contact: {...settings.contact, address: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ej: Cll 72 sur #14-80 Bogotá"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Enlace de Google Maps</label>
                    <input 
                        type="url" 
                        value={settings.contact.map_url || ''}
                        onChange={e => setSettings({...settings, contact: {...settings.contact, map_url: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="https://maps.app.goo.gl/..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">URL de la Imagen de la Fachada/Mapa</label>
                    <input 
                        type="text" 
                        value={settings.general.location_image_url || ''}
                        onChange={e => setSettings({...settings, general: {...settings.general, location_image_url: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="/shop.webp o https://..."
                    />
                </div>

                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">URL del Logo</label>
                        <input 
                            type="text" 
                            value={settings.general.logo_url || ''}
                            onChange={e => setSettings({...settings, general: {...settings.general, logo_url: e.target.value}})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                            placeholder="/lojito.webp o https://..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">Año de Fundación</label>
                        <input 
                            type="text" 
                            value={settings.general.established_year || ''}
                            onChange={e => setSettings({...settings, general: {...settings.general, established_year: e.target.value}})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                            placeholder="Ej: 2018"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">Calificación (Rating)</label>
                        <input 
                            type="text" 
                            value={settings.general.rating || ''}
                            onChange={e => setSettings({...settings, general: {...settings.general, rating: e.target.value}})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                            placeholder="Ej: 5.0"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">Cantidad de Reseñas</label>
                        <input 
                            type="text" 
                            value={settings.general.reviews_count || ''}
                            onChange={e => setSettings({...settings, general: {...settings.general, reviews_count: e.target.value}})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                            placeholder="Ej: 341"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Frase o Slogan</label>
                    <input 
                        type="text" 
                        value={settings.general.slogan || ''}
                        onChange={e => setSettings({...settings, general: {...settings.general, slogan: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ej: Donde comienza el camino del caballero"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Descripción del negocio</label>
                    <textarea 
                        rows={6}
                        value={settings.general.description || ''}
                        onChange={e => setSettings({...settings, general: {...settings.general, description: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors resize-y"
                        placeholder="Describe la experiencia de tu barbería..."
                    />
                </div>
            </div>
            
            <div className="pt-4">
                <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                    <Save className="w-5 h-5" /> Guardar Cambios
                </button>
            </div>
        </div>
    )

    const renderContacto = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <p className="text-sm text-dash-text-soft">Administra tus enlaces de redes sociales y detalles de contacto público.</p>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text flex items-center gap-2"><Facebook className="w-4 h-4 text-[#1877F2]" /> Enlace de Facebook</label>
                    <input 
                        type="url" 
                        value={settings.contact.facebook || ''}
                        onChange={e => setSettings({...settings, contact: {...settings.contact, facebook: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="https://facebook.com/..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500" /> Enlace de Instagram</label>
                    <input 
                        type="url" 
                        value={settings.contact.instagram || ''}
                        onChange={e => setSettings({...settings, contact: {...settings.contact, instagram: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="https://instagram.com/..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Número de WhatsApp Público</label>
                    <input 
                        type="tel" 
                        value={settings.contact.whatsapp || ''}
                        onChange={e => setSettings({...settings, contact: {...settings.contact, whatsapp: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ej: +57 300 123 4567"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-dash-text">Texto de Horario de Atención</label>
                    <input 
                        type="text" 
                        value={settings.contact.schedule || ''}
                        onChange={e => setSettings({...settings, contact: {...settings.contact, schedule: e.target.value}})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        placeholder="Ej: 09:00 - 20:00"
                    />
                </div>
            </div>

            <div className="pt-4">
                <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                    <Save className="w-5 h-5" /> Guardar Cambios
                </button>
            </div>
        </div>
    )

    
    const renderNosotros = () => {
        // Precargar con valores por defecto si no hay ninguno, para que el administrador sepa qué hay
        const defaultFeatures = [
            "Productos de cuidado masculino",
            "Camisetas, gorras, relojes y joyas",
            "Ceras, aceites, fragancias exclusivas"
        ];
        
        const currentFeatures = settings.general.about_features || [];
        const features = currentFeatures.length > 0 ? currentFeatures : defaultFeatures;
        
        const addFeature = () => {
            setSettings({
                ...settings,
                general: {
                    ...settings.general,
                    about_features: [...features, "Nueva característica"]
                }
            });
        };
        
        const updateFeature = (index: number, value: string) => {
            const newFeatures = [...features];
            newFeatures[index] = value;
            setSettings({
                ...settings,
                general: {
                    ...settings.general,
                    about_features: newFeatures
                }
            });
        };
        
        const removeFeature = (index: number) => {
            const newFeatures = features.filter((_, i) => i !== index);
            setSettings({
                ...settings,
                general: {
                    ...settings.general,
                    about_features: newFeatures
                }
            });
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-dash-text-soft">Gestiona las viñetas que aparecen en la sección &quot;Sobre Nosotros&quot;.</p>
                    <button onClick={addFeature} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm">
                        <Plus className="w-4 h-4" /> Añadir Viñeta
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-dash-text">Título de la Lista</label>
                        <input 
                            type="text"
                            value={settings.general.about_features_title || ''}
                            onChange={e => setSettings({...settings, general: {...settings.general, about_features_title: e.target.value}})}
                            placeholder="Ej: Descubrí nuestra selección:"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-dash-text block mt-4">Elementos de la Lista</label>
                        {features.map((feature, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <input 
                                    type="text"
                                    value={feature}
                                    onChange={e => updateFeature(index, e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                />
                                <button onClick={() => removeFeature(index)} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-3 rounded-xl transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {features.length === 0 && <p className="text-white/40 text-sm italic">No hay viñetas añadidas.</p>}
                    </div>
                </div>
                
                <div className="pt-4">
                    <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                        <Save className="w-5 h-5" /> Guardar Cambios
                    </button>
                </div>
            </div>
        );
    };


    const renderSecciones = () => {
        const addSection = () => {
            const newSection = {
                id: crypto.randomUUID(),
                title: "Nueva Sección",
                content: "",
                type: "text_only" as const,
                images: []
            }
            setSettings({
                ...settings,
                custom_sections: [...settings.custom_sections, newSection]
            })
        }

        const updateSection = (id: string, field: string, value: any) => {
            setSettings({
                ...settings,
                custom_sections: settings.custom_sections.map(s => s.id === id ? { ...s, [field]: value } : s)
            })
        }

        const removeSection = (id: string) => {
            if(confirm("¿Estás seguro de eliminar esta sección?")) {
                setSettings({
                    ...settings,
                    custom_sections: settings.custom_sections.filter(s => s.id !== id)
                })
            }
        }

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-dash-text-soft">Añade secciones personalizadas a tu página de inicio.</p>
                    <button onClick={addSection} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm">
                        <Plus className="w-4 h-4" /> Añadir Sección
                    </button>
                </div>

                {settings.custom_sections.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/20 text-white/40">
                        No has creado ninguna sección extra.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {settings.custom_sections.map((section, index) => (
                            <div key={section.id} className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="w-5 h-5 text-white/20 cursor-move" />
                                        <span className="font-bold text-white/80">Sección #{index + 1}</span>
                                    </div>
                                    <button onClick={() => removeSection(section.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-dash-text-soft uppercase">Título de la sección</label>
                                        <input 
                                            type="text" 
                                            value={section.title}
                                            onChange={e => updateSection(section.id, 'title', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-dash-text-soft uppercase">Formato Visual</label>
                                        <select 
                                            value={section.type}
                                            onChange={e => updateSection(section.id, 'type', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none appearance-none"
                                        >
                                            <option value="text_only">Solo Texto</option>
                                            <option value="with_images">Texto Destacado (Caja limpia)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-dash-text-soft uppercase">Contenido</label>
                                    <textarea 
                                        rows={4}
                                        value={section.content}
                                        onChange={e => updateSection(section.id, 'content', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none resize-y"
                                        placeholder="Escribe aquí el contenido..."
                                    />
                                </div>

                                {section.type === 'with_images' && (
                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-dash-text-soft uppercase">Imágenes de la Sección</label>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {(section.images || []).map((imgUrl, i) => (
                                                <div key={i} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 group">
                                                    <img src={imgUrl} alt="Sección" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <button 
                                                            onClick={() => updateSection(section.id, 'images', (section.images || []).filter((_: string, index: number) => index !== i))}
                                                            className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            <input 
                                                type="url"
                                                id={`url-${section.id}`}
                                                placeholder="Pega el enlace directo a una imagen (ej: https://...)"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none"
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const input = document.getElementById(`url-${section.id}`) as HTMLInputElement;
                                                    if (input.value) {
                                                        updateSection(section.id, 'images', [...(section.images || []), input.value]);
                                                        input.value = '';
                                                    }
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-all font-bold text-sm"
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-white/40">Pega enlaces directos a las imágenes para mostrarlas en una galería exclusiva de esta sección.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4">
                    <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                        <Save className="w-5 h-5" /> Guardar Cambios
                    </button>
                </div>
            </div>
        )
    }

    const renderEnConstruccion = (title: string) => (
        <div className="py-20 text-center animate-in fade-in">
            <h3 className="text-xl font-bold text-white/50 mb-2">{title}</h3>
            <p className="text-sm text-dash-text-soft">Esta sección está en construcción y estará disponible pronto.</p>
        </div>
    )

    return (
        <div className="w-full">
            {/* Header / Tabs Nav */}
            <div className="border-b border-white/10 mb-8 overflow-x-auto scrollbar-hide">
                <nav className="flex min-w-max space-x-8 px-2" aria-label="Tabs">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors
                                    ${isActive 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-white/50 hover:text-white hover:border-white/20'}
                                `}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
                {activeTab === 'general' && renderGeneral()}
                {activeTab === 'nosotros' && renderNosotros()}
                {activeTab === 'contacto' && renderContacto()}
                {activeTab === 'secciones' && renderSecciones()}
                {activeTab === 'horarios' && renderEnConstruccion("Configuración de Horarios")}
                {activeTab === 'cartera' && renderEnConstruccion("Configuración de Cartera")}
                {activeTab === 'galeria' && (
                    <div className="animate-in fade-in duration-300">
                        <p className="text-sm text-dash-text-soft mb-6">Gestiona las fotografías de la galería de tu sitio web.</p>
                        <GalleryManager initialImages={initialImages} />
                    </div>
                )}
            </div>
        </div>
    )
}
