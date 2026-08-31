-- Expanded Supabase SQL Migration Script for Challenge Tracker Pro
-- File: supabase/migrations/20260820000000_expanded_schema.sql

-- 1. Create Custom Enum Types
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE account_status AS ENUM ('active', 'inactive');
CREATE TYPE progress_status AS ENUM ('incomplete', 'ongoing', 'complete');

-- 2. Create Tables

-- Cohorts Table
CREATE TABLE IF NOT EXISTS public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role DEFAULT 'user'::app_role NOT NULL,
    account_status account_status DEFAULT 'active'::account_status NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Challenges Table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    resource_url TEXT,
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Hardcore')),
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    progress_status progress_status DEFAULT 'incomplete'::progress_status NOT NULL,
    linkedin_url TEXT,
    github_url TEXT,
    completed_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_challenge_user UNIQUE (challenge_id, user_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'::app_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by owner or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile, Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Allow system trigger insertion for profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- Challenges Policies
CREATE POLICY "Authenticated users can view non-archived challenges or assigned challenges"
    ON public.challenges FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            is_archived = false 
            OR public.is_admin()
            OR EXISTS (
                SELECT 1 FROM public.assignments 
                WHERE assignments.challenge_id = challenges.id 
                AND assignments.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can insert challenges"
    ON public.challenges FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update challenges"
    ON public.challenges FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete challenges"
    ON public.challenges FOR DELETE
    USING (public.is_admin());

-- Assignments Policies
CREATE POLICY "Users view own assignments, Admins view all assignments"
    ON public.assignments FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users update own assignment progress, Admins update any"
    ON public.assignments FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins insert assignments"
    ON public.assignments FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete assignments"
    ON public.assignments FOR DELETE
    USING (public.is_admin());

-- Notifications Policies
CREATE POLICY "Users view own notifications, Admins view all"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users update own notification read state, Admins update any"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Allow trigger or admin to insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- Cohorts Policies
CREATE POLICY "Cohorts are viewable by authenticated users"
    ON public.cohorts FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage cohorts"
    ON public.cohorts FOR ALL
    USING (public.is_admin());

-- 4. Triggers & Functions

-- Function: Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, role, account_status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id),
        COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'::app_role),
        'active'::account_status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Auto-create notification when an assignment is inserted
CREATE OR REPLACE FUNCTION public.handle_new_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_challenge_title TEXT;
BEGIN
    SELECT title INTO v_challenge_title FROM public.challenges WHERE id = NEW.challenge_id;
    
    INSERT INTO public.notifications (user_id, message, is_read)
    VALUES (
        NEW.user_id,
        'You have been assigned a new challenge: "' || COALESCE(v_challenge_title, 'Challenge') || '"',
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on assignments insertion
DROP TRIGGER IF EXISTS on_assignment_created ON public.assignments;
CREATE TRIGGER on_assignment_created
    AFTER INSERT ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_assignment_notification();

-- RPC Function: Bulk assignment of active users to a challenge
CREATE OR REPLACE FUNCTION public.assign_challenge_users(
    p_challenge_id UUID,
    p_user_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_uid UUID;
BEGIN
    -- Verify admin caller
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin permissions required.';
    END IF;

    FOREACH v_uid IN ARRAY p_user_ids
    LOOP
        -- Check if user is active
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND account_status = 'active') THEN
            INSERT INTO public.assignments (challenge_id, user_id, progress_status)
            VALUES (p_challenge_id, v_uid, 'incomplete'::progress_status)
            ON CONFLICT (challenge_id, user_id) DO NOTHING;
            
            IF FOUND THEN
                v_inserted_count := v_inserted_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
