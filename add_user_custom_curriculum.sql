-- Add user_id to support custom items
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;
ALTER TABLE public.class_topics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Update RLS for class_subjects
DROP POLICY IF EXISTS "Public read class_subjects" ON public.class_subjects;
CREATE POLICY "Users can read public and own class_subjects" ON public.class_subjects 
FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own class_subjects" ON public.class_subjects 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update RLS for class_topics
DROP POLICY IF EXISTS "Public read class_topics" ON public.class_topics;
CREATE POLICY "Users can read public and own class_topics" ON public.class_topics 
FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own class_topics" ON public.class_topics 
FOR INSERT WITH CHECK (user_id = auth.uid());
