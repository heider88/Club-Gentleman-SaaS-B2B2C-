ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT 'Barbero';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 50.00;
