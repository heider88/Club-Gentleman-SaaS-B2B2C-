-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Barbers can read their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = barber_id);

CREATE POLICY "Barbers can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = barber_id);

-- Create Trigger Function
CREATE OR REPLACE FUNCTION handle_new_appointment_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (barber_id, appointment_id, message, appointment_date)
    VALUES (
        NEW.barber_id, 
        NEW.id, 
        'Nueva cita: ' || NEW.customer_name || ' (' || to_char(NEW.start_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota', 'HH12:MI AM') || ')',
        (NEW.start_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota')::date
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to prevent duplicates
DROP TRIGGER IF EXISTS on_appointment_created ON public.appointments;

-- Create Trigger
CREATE TRIGGER on_appointment_created
    AFTER INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_appointment_notification();
    
-- Enable realtime for notifications table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
