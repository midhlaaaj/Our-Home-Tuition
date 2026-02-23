-- Add curriculum column to class_subjects table
ALTER TABLE public.class_subjects
ADD COLUMN curriculum TEXT NOT NULL DEFAULT 'CBSE' CHECK (curriculum IN ('CBSE', 'STATE'));

-- Create index for faster curriculum-based queries
CREATE INDEX idx_class_subjects_curriculum ON public.class_subjects(curriculum);
