
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  measured_at date NOT NULL DEFAULT CURRENT_DATE,
  sex text NOT NULL CHECK (sex IN ('male', 'female')),
  age integer NOT NULL,
  weight numeric NOT NULL,

  skinfold_chest numeric,
  skinfold_axillary numeric,
  skinfold_triceps numeric,
  skinfold_subscapular numeric,
  skinfold_abdominal numeric,
  skinfold_suprailiac numeric,
  skinfold_thigh numeric,

  perim_neck numeric,
  perim_shoulder numeric,
  perim_chest numeric,
  perim_waist numeric,
  perim_abdomen numeric,
  perim_hip numeric,
  perim_arm_relaxed numeric,
  perim_arm_contracted numeric,
  perim_forearm numeric,
  perim_thigh_proximal numeric,
  perim_thigh_mid numeric,
  perim_calf numeric,

  body_density numeric,
  body_fat_pct numeric,
  fat_mass_kg numeric,
  lean_mass_kg numeric,
  sum_skinfolds numeric,

  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view their assessments"
ON public.assessments FOR SELECT
USING ((auth.uid() = trainer_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Trainers can insert assessments"
ON public.assessments FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update assessments"
ON public.assessments FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete assessments"
ON public.assessments FOR DELETE
USING (auth.uid() = trainer_id);
