-- Create the trigger that was missing
CREATE TRIGGER on_profile_created_add_subscription
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_free_subscription();

-- Also insert a subscription for existing trainers that don't have one
INSERT INTO public.trainer_subscriptions (trainer_id, plan, price)
SELECT p.user_id, 'free', 0
FROM public.profiles p
WHERE p.role = 'trainer'
  AND NOT EXISTS (
    SELECT 1 FROM public.trainer_subscriptions ts WHERE ts.trainer_id = p.user_id
  );

-- Allow trainers to update their own subscription (needed for PIX flow)
CREATE POLICY "Trainers can update own subscription"
ON public.trainer_subscriptions
FOR UPDATE
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);