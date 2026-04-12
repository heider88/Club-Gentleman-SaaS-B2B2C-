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
