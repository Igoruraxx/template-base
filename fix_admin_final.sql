INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'semap.igor@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::TEXT = _role
  )
$$;

DROP POLICY IF EXISTS "Trainers can delete their own students" ON public.students;
CREATE POLICY "Trainers can delete their own students"
ON public.students FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete their own sessions" ON public.sessions;
CREATE POLICY "Trainers can delete their own sessions"
ON public.sessions FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete payments" ON public.payments;
CREATE POLICY "Trainers can delete payments"
ON public.payments FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete assessments" ON public.assessments;
CREATE POLICY "Trainers can delete assessments"
ON public.assessments FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete photos" ON public.progress_photos;
CREATE POLICY "Trainers can delete photos"
ON public.progress_photos FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can delete bioimpedance"
ON public.bioimpedance FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DELETE FROM public.students 
WHERE email LIKE '%@fake.com';
