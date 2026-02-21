1
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('bioimpedance-reports', 'bioimpedance-reports', true);

-- Storage policies for progress-photos
CREATE POLICY "Trainers can upload progress photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view progress photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos');

CREATE POLICY "Trainers can delete progress photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');

-- Storage policies for bioimpedance-reports
CREATE POLICY "Trainers can upload bioimpedance reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bioimpedance-reports' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view bioimpedance reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'bioimpedance-reports');

CREATE POLICY "Trainers can delete bioimpedance reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'bioimpedance-reports' AND auth.role() = 'authenticated');

-- Progress photos table
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'front' CHECK (photo_type IN ('front', 'side', 'back', 'other')),
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their students photos"
ON public.progress_photos FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert photos"
ON public.progress_photos FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete photos"
ON public.progress_photos FOR DELETE
USING (auth.uid() = trainer_id);

CREATE INDEX idx_progress_photos_student ON public.progress_photos(student_id);

-- Bioimpedance records table
CREATE TABLE public.bioimpedance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC(5,2),
  body_fat_pct NUMERIC(5,2),
  muscle_mass NUMERIC(5,2),
  visceral_fat NUMERIC(5,2),
  bmr NUMERIC(7,2),
  body_water_pct NUMERIC(5,2),
  bone_mass NUMERIC(5,2),
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bioimpedance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their bioimpedance records"
ON public.bioimpedance FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert bioimpedance"
ON public.bioimpedance FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update bioimpedance"
ON public.bioimpedance FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete bioimpedance"
ON public.bioimpedance FOR DELETE
USING (auth.uid() = trainer_id);

CREATE INDEX idx_bioimpedance_student ON public.bioimpedance(student_id);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reference_month TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their payments"
ON public.payments FOR SELECT
USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update payments"
ON public.payments FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete payments"
ON public.payments FOR DELETE
USING (auth.uid() = trainer_id);

CREATE INDEX idx_payments_student ON public.payments(student_id);
CREATE INDEX idx_payments_month ON public.payments(reference_month);

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Student access codes for portal
ALTER TABLE public.students ADD COLUMN access_code TEXT UNIQUE;

-- Allow students to view their own data via access code (public read with code)
CREATE OR REPLACE FUNCTION public.get_student_by_code(_code TEXT)
RETURNS SETOF public.students
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.students WHERE access_code = _code AND access_code IS NOT NULL;
$$;
