
CREATE OR REPLACE FUNCTION public.get_student_sessions(_student_id uuid)
RETURNS TABLE (
  id uuid, scheduled_date date, scheduled_time time,
  status text, muscle_groups text[], notes text,
  duration_minutes int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.scheduled_date, s.scheduled_time,
         s.status, s.muscle_groups, s.notes, s.duration_minutes
  FROM sessions s
  JOIN students st ON st.id = s.student_id
  WHERE s.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY s.scheduled_date DESC
  LIMIT 30;
$$;

CREATE OR REPLACE FUNCTION public.get_student_photos(_student_id uuid)
RETURNS TABLE (id uuid, photo_url text, photo_type text, taken_at date, notes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.photo_url, p.photo_type, p.taken_at, p.notes
  FROM progress_photos p
  JOIN students st ON st.id = p.student_id
  WHERE p.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY p.taken_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_student_bio(_student_id uuid)
RETURNS TABLE (
  id uuid, measured_at date, weight numeric,
  body_fat_pct numeric, muscle_mass numeric,
  visceral_fat numeric, bmr numeric, body_water_pct numeric, bone_mass numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.measured_at, b.weight, b.body_fat_pct,
         b.muscle_mass, b.visceral_fat, b.bmr, b.body_water_pct, b.bone_mass
  FROM bioimpedance b
  JOIN students st ON st.id = b.student_id
  WHERE b.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY b.measured_at ASC;
$$;
