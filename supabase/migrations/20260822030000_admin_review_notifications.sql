-- 1. Create the function that generates the notification
CREATE OR REPLACE FUNCTION public.notify_admin_on_submission()
RETURNS TRIGGER AS $$
DECLARE
    student_name TEXT;
    chal_title TEXT;
    admin_record RECORD;
BEGIN
    -- Only execute if the progress status just changed to 'complete'
    IF NEW.progress_status = 'complete' AND OLD.progress_status != 'complete' THEN
        
        -- Fetch the student's display name
        SELECT display_name INTO student_name FROM public.profiles WHERE id = NEW.user_id;
        
        -- Fetch the challenge title
        SELECT title INTO chal_title FROM public.challenges WHERE id = NEW.challenge_id;

        -- Loop through all users with the 'admin' role and insert a notification for each
        FOR admin_record IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
            INSERT INTO public.notifications (user_id, message, type)
            VALUES (
                admin_record.id,
                student_name || ' has completed the assignment "' || chal_title || '". Please review their submission.',
                'system'
            );
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the assignments table
DROP TRIGGER IF EXISTS on_assignment_completed ON public.assignments;
CREATE TRIGGER on_assignment_completed
    AFTER UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_submission();
