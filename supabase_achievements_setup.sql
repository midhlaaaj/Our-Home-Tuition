-- ACHIEVEMENTS TABLE SETUP
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  number text not null,
  icon text null,
  display_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint achievements_pkey primary key (id)
) TABLESPACE pg_default;

-- Trigger for updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_achievements') THEN
        CREATE TRIGGER handle_updated_at_achievements BEFORE
        UPDATE ON achievements FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at ();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Wait for supabase_migration_rls.sql for full lockdown)
DROP POLICY IF EXISTS "Public read achievements" ON public.achievements;
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage achievements" ON public.achievements;
CREATE POLICY "Admin manage achievements" ON public.achievements FOR ALL USING (true); -- Simplified for initial setup
