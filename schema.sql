-- =========================================================
-- SCRIPT DE BASE DE DATOS: Club Gentleman for Men (Barber SaaS)
-- =========================================================

-- 1. Extensiones Necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumeradores
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

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
  phone TEXT,
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
-- UPDATE / DELETE: El dueño gestiona su propia fila
CREATE POLICY "Barbers can modify their appointments" ON public.appointments FOR UPDATE USING (auth.uid() = barber_id);
CREATE POLICY "Barbers can delete their appointments" ON public.appointments FOR DELETE USING (auth.uid() = barber_id);


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
