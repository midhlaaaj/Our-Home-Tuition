-- 1. Ensure columns are nullable so the trigger doesn't fail
-- (In case your profiles table already exists with NOT NULL constraints)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
        ALTER TABLE public.profiles ALTER COLUMN address DROP NOT NULL;
    END IF;
END $$;

-- 2. Create profiles table if not exists (Basic version)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update the trigger function to be robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-apply the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Finally, the state region column for classes
ALTER TABLE public.class_subjects
ADD COLUMN IF NOT EXISTS state_region TEXT NOT NULL DEFAULT 'ANDHRA' CHECK (state_region IN ('ANDHRA', 'TELANGANA'));

DROP INDEX IF EXISTS idx_class_subjects_state_region;
CREATE INDEX idx_class_subjects_state_region ON public.class_subjects(state_region);
