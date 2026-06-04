-- =========================================================
-- SCRIPT DE BASE DE DATOS: Club Gentleman for Men (Barber SaaS)
-- =========================================================

-- 1. Extensiones Necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumeradores
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE user_role AS ENUM ('admin', 'barber');

-- =========================================================
-- TABLAS
-- =========================================================

-- Tabla de Perfiles (Conectada a Auth de Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  specialty TEXT DEFAULT 'Barbero',
  commission_percentage DECIMAL(5,2) DEFAULT 50.00,
  phone TEXT,
  role user_role DEFAULT 'barber',
  -- JSONB para máxima flexibilidad en configuraciones complejas de agenda
  schedule_settings JSONB DEFAULT '{"workDays": [1,2,3,4,5,6], "startHour": 9, "endHour": 19, "lunchStart": 13, "lunchEnd": 14}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Servicios
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0), -- Constraint: Evitar precios negativos
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Citas (Appointments)
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status appointment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint Lógica 1: Fin no puede ser antes del inicio
  CONSTRAINT end_time_must_be_after_start_time CHECK (end_time > start_time)
);

-- =========================================================
-- EXTENSIONES Y RESTRICCIONES AVANZADAS
-- =========================================================
-- Habilita btree_gist para permitir constraints de exclusión con campos regulares (como UUID)
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- Constraint de Exclusión: Evita la "Doble Reserva" (Condición de Carrera)
-- Asegura que un mismo barbero no tenga dos citas activas (no canceladas) que se superpongan en tiempo.
ALTER TABLE public.appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
  barber_id WITH =, 
  tstzrange(start_time, end_time) WITH &&
) WHERE (status != 'cancelled');

-- Tabla de Bloqueos Manuales de Disponibilidad
CREATE TABLE public.availability_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint Lógica 2
  CONSTRAINT end_time_must_be_after_start_time CHECK (end_time > start_time)
);

-- =========================================================
-- SEGURIDAD (Row Level Security - RLS)
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;


-- Políticas de Perfiles (Profiles) -------------------------------------------
-- SELECT: Público
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- UPDATE: Solo dueño (Barbero)
CREATE POLICY "Barbers can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- INSERT: Generado al registrarse el usuario
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- Políticas de Servicios (Services) ------------------------------------------
-- SELECT: Público
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);
-- ALL (CRUD): Solo dueño de la fila
CREATE POLICY "Barbers can manage own services" ON public.services FOR ALL USING (auth.uid() = barber_id);


-- Políticas de Citas (Appointments) ------------------------------------------
-- INSERT: Público permite agendar a clientes no logueados
CREATE POLICY "Public can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
-- SELECT (Barbero): El dueño lee todo (Nombres y Horarios)
CREATE POLICY "Barbers can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = barber_id);
-- SELECT (Admin): El dueño o administrador puede ver TODO el negocio
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
-- UPDATE: El dueño gestiona su propia fila (necesario para marcar como completada)
CREATE POLICY "Barbers can modify their appointments" ON public.appointments FOR UPDATE USING (auth.uid() = barber_id);
-- DELETE: Eliminado para barberos por reglas de negocio. Solo Admin (Service Role) puede eliminar/cancelar.


-- Privacidad en Appointments (Protección de PII por Data Exfiltration) -----
-- Permite a un cliente anónimo saber a qué horas hay citas para evitar Double Booking.
CREATE POLICY "Public can view timeslots" ON public.appointments FOR SELECT TO anon USING (true);

-- Como la política de arriba expone la estructura de fechas, usamos Column-Level Security (PostgreSQL NATIF)
-- Revocamos el SELECT general público:
REVOKE SELECT ON public.appointments FROM anon;
-- Y les concedemos acceso de SOLO-LECTURA a las columnas no-sensibles vitales
GRANT SELECT (id, barber_id, service_id, start_time, end_time, status) ON public.appointments TO anon;
-- (Es vital mantener el permiso de INSERT intacto para anon so puedan agendar)
GRANT INSERT ON public.appointments TO anon;


-- Políticas de Bloqueos de Horario (Availability Blocks) ---------------------
-- SELECT: Público debe consultar bloqueos médicos/almuerzos extra para evitar double booking
CREATE POLICY "Public can view blocks" ON public.availability_blocks FOR SELECT USING (true);
-- ALL: El barbero dueño gestiona los bloqueos
CREATE POLICY "Barbers can manage blocks" ON public.availability_blocks FOR ALL USING (auth.uid() = barber_id);
-- SELECT (Admin): El Admin puede ver los bloqueos de todos
CREATE POLICY "Admins can view all blocks" ON public.availability_blocks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
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
-- ==============================================================================
-- TRIGGER: Creación Automática de Perfil de Barbero
-- ==============================================================================

-- 1. Crear la Función del Trigger
-- Esta función será ejecutada por Supabase en el schema de Auth.
-- Utilizamos "SECURITY DEFINER" para que tenga permisos de saltar el RLS de insersión temporalmente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insertamos la fila automática extrayendo ID y Correo del nuevo registro en auth.users
  INSERT INTO public.profiles (id, email, schedule_settings)
  VALUES (
    new.id,
    new.email,
    -- JSONB por defecto (Atiende de Lunes a Sábado de 9:00 AM a 7:00 PM, Almuerzo de 1PM a 2PM)
    '{"workDays": [1,2,3,4,5,6], "startHour": 9, "endHour": 19, "lunchStart": 13, "lunchEnd": 14}'::jsonb
  );
  
  RETURN new;
END;
$$;

-- 2. Vincular el Evento
-- Limpiamos si existía un trigger viejo, y creamos el nuevo trigger anclado al INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
