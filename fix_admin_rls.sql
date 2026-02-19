-- Script para Corrigir Permissões de Admin (RLS)
-- Este script adiciona a condição de admin em todas as políticas de INSERT, UPDATE e DELETE.

-- ==================== STUDENTS ====================
DROP POLICY IF EXISTS "Trainers can insert their own students" ON public.students;
CREATE POLICY "Trainers can insert their own students"
ON public.students FOR INSERT WITH CHECK (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can update their own students" ON public.students;
CREATE POLICY "Trainers can update their own students"
ON public.students FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete their own students" ON public.students;
CREATE POLICY "Trainers can delete their own students"
ON public.students FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== SESSIONS ====================
DROP POLICY IF EXISTS "Trainers can insert their own sessions" ON public.sessions;
CREATE POLICY "Trainers can insert their own sessions"
ON public.sessions FOR INSERT WITH CHECK (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can update their own sessions" ON public.sessions;
CREATE POLICY "Trainers can update their own sessions"
ON public.sessions FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete their own sessions" ON public.sessions;
CREATE POLICY "Trainers can delete their own sessions"
ON public.sessions FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== PAYMENTS ====================
DROP POLICY IF EXISTS "Trainers can insert payments" ON public.payments;
CREATE POLICY "Trainers can insert payments"
ON public.payments FOR INSERT WITH CHECK (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can update payments" ON public.payments;
CREATE POLICY "Trainers can update payments"
ON public.payments FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete payments" ON public.payments;
CREATE POLICY "Trainers can delete payments"
ON public.payments FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== PROGRESS PHOTOS ====================
DROP POLICY IF EXISTS "Trainers can insert photos" ON public.progress_photos;
CREATE POLICY "Trainers can insert photos"
ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete photos" ON public.progress_photos;
CREATE POLICY "Trainers can delete photos"
ON public.progress_photos FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== BIOIMPEDANCE ====================
DROP POLICY IF EXISTS "Trainers can insert bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can insert bioimpedance"
ON public.bioimpedance FOR INSERT WITH CHECK (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can update bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can update bioimpedance"
ON public.bioimpedance FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete bioimpedance" ON public.bioimpedance;
CREATE POLICY "Trainers can delete bioimpedance"
ON public.bioimpedance FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== ASSESSMENTS ====================
DROP POLICY IF EXISTS "Trainers can insert assessments" ON public.assessments;
CREATE POLICY "Trainers can insert assessments"
ON public.assessments FOR INSERT WITH CHECK (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can update assessments" ON public.assessments;
CREATE POLICY "Trainers can update assessments"
ON public.assessments FOR UPDATE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Trainers can delete assessments" ON public.assessments;
CREATE POLICY "Trainers can delete assessments"
ON public.assessments FOR DELETE USING (auth.uid() = trainer_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Trainers can update own profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ==================== STORAGE ====================
-- Progress Photos
DROP POLICY IF EXISTS "Admins view all progress photos" ON storage.objects;
CREATE POLICY "Admins view all progress photos" ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete all progress photos" ON storage.objects;
CREATE POLICY "Admins delete all progress photos" ON storage.objects FOR DELETE
USING (bucket_id = 'progress-photos' AND public.has_role(auth.uid(), 'admin'));

-- Bioimpedance Reports
DROP POLICY IF EXISTS "Admins view all bioimpedance reports" ON storage.objects;
CREATE POLICY "Admins view all bioimpedance reports" ON storage.objects FOR SELECT
USING (bucket_id = 'bioimpedance-reports' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete all bioimpedance reports" ON storage.objects;
CREATE POLICY "Admins delete all bioimpedance reports" ON storage.objects FOR DELETE
USING (bucket_id = 'bioimpedance-reports' AND public.has_role(auth.uid(), 'admin'));
