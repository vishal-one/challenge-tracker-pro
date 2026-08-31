-- Add a flag to challenges to determine if it requires the code editor
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS is_coding_challenge BOOLEAN DEFAULT FALSE NOT NULL;

-- Add a column to assignments to store the student's raw code submission
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS submitted_code TEXT;
