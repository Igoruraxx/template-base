-- Update the check_student_limit trigger function
-- Allow INSERT always (unlimited registration)
-- Block UPDATE to 'active' when free plan and already at 5 active students
CREATE OR REPLACE FUNCTION public.check_student_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_plan text;
  current_status text;
  student_count bigint;
BEGIN
  -- Only check when setting status to 'active'
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, if already active, allow
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(ts.plan, 'free'), COALESCE(ts.status, 'active')
  INTO current_plan, current_status
  FROM trainer_subscriptions ts
  WHERE ts.trainer_id = NEW.trainer_id;

  -- If no subscription found, treat as free
  IF current_plan IS NULL THEN
    current_plan := 'free';
  END IF;

  -- Premium or blocked trainers skip limit check
  IF current_plan = 'premium' AND current_status = 'active' THEN
    RETURN NEW;
  END IF;

  -- Count current active students
  SELECT COUNT(*) INTO student_count
  FROM students
  WHERE trainer_id = NEW.trainer_id AND status = 'active'
    AND id IS DISTINCT FROM NEW.id;

  IF student_count >= 5 THEN
    RAISE EXCEPTION 'STUDENT_LIMIT_REACHED: Free plan allows max 5 active students. Upgrade to premium.';
  END IF;

  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists on both INSERT and UPDATE
DROP TRIGGER IF EXISTS check_student_limit_trigger ON students;
CREATE TRIGGER check_student_limit_trigger
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION check_student_limit();
