
-- Table to store push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  daily_summary_hour integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Trainers can view their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = trainer_id);

-- Trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
