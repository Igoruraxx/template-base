
-- Add schedule_config (jsonb) for flexible day/time scheduling
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS schedule_config jsonb;

-- Add needs_reminder (boolean) for reminder tag
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS needs_reminder boolean DEFAULT false;

-- Add payment_due_day (integer) for payment due date
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS payment_due_day integer;
