-- 1. Robustly drop constraints and alter column type
DO $$ 
DECLARE 
    constraint_record RECORD;
BEGIN 
    -- 1a. Drop all CHECK constraints on mentor_availability to prevent "text >= integer" errors
    FOR constraint_record IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.mentor_availability'::regclass 
        AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE public.mentor_availability DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
    END LOOP;

    -- 1b. Alter day_of_week from INTEGER to TEXT if it's currently INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'mentor_availability' 
        AND column_name = 'day_of_week' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.mentor_availability ALTER COLUMN day_of_week TYPE TEXT USING day_of_week::TEXT;
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Admins have full access to mentor_availability" ON public.mentor_availability;
DROP POLICY IF EXISTS "Mentors can manage their own availability" ON public.mentor_availability;
DROP POLICY IF EXISTS "Mentors can view their own availability" ON public.mentor_availability;
DROP POLICY IF EXISTS "Authenticated users can view mentor availability" ON public.mentor_availability;

-- 4. Define Policies

-- ADMIN: Full access
CREATE POLICY "Admins have full access to mentor_availability" ON public.mentor_availability
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- MENTOR: Manage their own availability
CREATE POLICY "Mentors can manage their own availability" ON public.mentor_availability
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM mentors
        WHERE mentors.id = mentor_availability.mentor_id
        AND mentors.auth_user_id = auth.uid()
    )
);

-- PUBLIC/AUTHENTICATED: View availability
CREATE POLICY "Authenticated users can view mentor availability" ON public.mentor_availability
FOR SELECT TO authenticated USING (true);

-- 5. Grant permissions
GRANT ALL ON public.mentor_availability TO authenticated;
GRANT ALL ON public.mentor_availability TO service_role;
