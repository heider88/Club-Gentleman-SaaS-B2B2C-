CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver la galería
CREATE POLICY "Public can view gallery" ON public.gallery_images FOR SELECT USING (true);

-- Solo el admin puede gestionar la galería (basado en el rol de la tabla profiles)
CREATE POLICY "Admin can manage gallery" ON public.gallery_images 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Configuración del Storage Bucket (Requiere que el bucket 'gallery' exista, lo crearemos por API o asumiendo configuración)
-- Nota: La creación de buckets usualmente se hace en el Dashboard de Supabase, 
-- pero podemos simular la tabla para las URLs por ahora.
