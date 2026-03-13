-- Fix Storage URLs after Migration
-- Run this in your NEW Supabase project's SQL Editor.
-- This replaces the old project ID with the new one in all image/media columns.

-- 1. Update Sliders
UPDATE public.sliders 
SET media_url = REPLACE(media_url, 'cskuylvbuswawhalnkty', 'abzwpidnymxfilrkcewh')
WHERE media_url LIKE '%cskuylvbuswawhalnkty%';

-- 2. Update Mentors
UPDATE public.mentors 
SET image_url = REPLACE(image_url, 'cskuylvbuswawhalnkty', 'abzwpidnymxfilrkcewh')
WHERE image_url LIKE '%cskuylvbuswawhalnkty%';

-- 3. Update Brands (using logo_url)
UPDATE public.brands 
SET logo_url = REPLACE(logo_url, 'cskuylvbuswawhalnkty', 'abzwpidnymxfilrkcewh')
WHERE logo_url LIKE '%cskuylvbuswawhalnkty%';

-- 4. Update Partners (using media_url)
UPDATE public.partners 
SET media_url = REPLACE(media_url, 'cskuylvbuswawhalnkty', 'abzwpidnymxfilrkcewh')
WHERE media_url LIKE '%cskuylvbuswawhalnkty%';

-- 5. Update Profiles (Avatar URLs)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
UPDATE public.profiles 
SET avatar_url = REPLACE(avatar_url, 'cskuylvbuswawhalnkty', 'abzwpidnymxfilrkcewh')
WHERE avatar_url LIKE '%cskuylvbuswawhalnkty%';

-- 6. Update Reviews (If they have images)
UPDATE public.reviews 
SET avatar_url = REPLACE(avatar_url, 'cskuylvbuswawhalnkty', 'abzwpidnymxfilrkcewh')
WHERE avatar_url LIKE '%cskuylvbuswawhalnkty%';
