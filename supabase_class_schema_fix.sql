-- SCHEMA FIX FOR CLASS_SUBJECTS AND CLASS_TOPICS
-- Run this in your Supabase SQL Editor as 'postgres' role.

--------------------------------------------------------------------------------
-- 1. Fix public.class_subjects
--------------------------------------------------------------------------------
ALTER TABLE public.class_subjects 
ADD COLUMN IF NOT EXISTS full_subject_price INTEGER DEFAULT 0;

ALTER TABLE public.class_subjects 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0;

--------------------------------------------------------------------------------
-- 2. Fix public.class_topics
--------------------------------------------------------------------------------
ALTER TABLE public.class_topics 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.class_topics 
ADD COLUMN IF NOT EXISTS unit_price INTEGER DEFAULT 100;

ALTER TABLE public.class_topics 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 60;

-- Comments:
-- full_subject_price: Total price for the entire subject
-- estimated_duration: Total duration (in minutes) for the subject/topic
-- unit_price: Price for an individual topic/unit
