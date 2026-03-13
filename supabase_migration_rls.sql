-- Consolidated RLS Policies for Our Home Tuition
-- Run this script in your Supabase SQL Editor to set up security for all tables.

--------------------------------------------------------------------------------
-- 1. Admin Helper Function
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 2. Profiles
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 3. Mentors
--------------------------------------------------------------------------------
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors are publicly visible" ON public.mentors FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Mentors can view their own record" ON public.mentors FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Mentors can update their own record" ON public.mentors FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Admins have full access to mentors" ON public.mentors FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 4. Bookings
--------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Mentors can view assigned bookings" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.mentors WHERE id = assigned_mentor_id AND auth_user_id = auth.uid()));
CREATE POLICY "Mentors can update assigned bookings" ON public.bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.mentors WHERE id = assigned_mentor_id AND auth_user_id = auth.uid()));
CREATE POLICY "Admins have full access to bookings" ON public.bookings FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 5. Booking Offers
--------------------------------------------------------------------------------
ALTER TABLE public.booking_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can view own offers" ON public.booking_offers FOR SELECT USING (EXISTS (SELECT 1 FROM public.mentors WHERE id = mentor_id AND auth_user_id = auth.uid()));
CREATE POLICY "Mentors can update own offers" ON public.booking_offers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.mentors WHERE id = mentor_id AND auth_user_id = auth.uid()));
CREATE POLICY "Admins have full access to booking_offers" ON public.booking_offers FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 6. Mentor Availability
--------------------------------------------------------------------------------
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability" ON public.mentor_availability FOR SELECT USING (true);
CREATE POLICY "Mentors can manage their own availability" ON public.mentor_availability FOR ALL USING (EXISTS (SELECT 1 FROM public.mentors WHERE id = mentor_id AND auth_user_id = auth.uid()));
CREATE POLICY "Admins have full access to mentor_availability" ON public.mentor_availability FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 7. Contact Queries
--------------------------------------------------------------------------------
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert contact queries" ON public.contact_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "Mentors can view assigned queries" ON public.contact_queries FOR SELECT USING (EXISTS (SELECT 1 FROM public.mentors WHERE id = assigned_mentor_id AND auth_user_id = auth.uid()));
CREATE POLICY "Admins have full access to contact_queries" ON public.contact_queries FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 8. Notifications
--------------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins have full access to notifications" ON public.notifications FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 9. Job Applications
--------------------------------------------------------------------------------
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply for jobs" ON public.job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins have full access to job_applications" ON public.job_applications FOR ALL USING (is_admin());

--------------------------------------------------------------------------------
-- 10. Public Content (Read: All, Manage: Admin)
--------------------------------------------------------------------------------

-- achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admin manage achievements" ON public.achievements FOR ALL USING (is_admin());

-- brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admin manage brands" ON public.brands FOR ALL USING (is_admin());

-- class_subjects
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read class_subjects" ON public.class_subjects FOR SELECT USING (true);
CREATE POLICY "Admin manage class_subjects" ON public.class_subjects FOR ALL USING (is_admin());

-- class_topics
ALTER TABLE public.class_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read class_topics" ON public.class_topics FOR SELECT USING (true);
CREATE POLICY "Admin manage class_topics" ON public.class_topics FOR ALL USING (is_admin());

-- counters
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read counters" ON public.counters FOR SELECT USING (true);
CREATE POLICY "Admin manage counters" ON public.counters FOR ALL USING (is_admin());

-- faqs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (is_admin());

-- jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Admin manage jobs" ON public.jobs FOR ALL USING (is_admin());

-- partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Admin manage partners" ON public.partners FOR ALL USING (is_admin());

-- reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- sliders
ALTER TABLE public.sliders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sliders" ON public.sliders FOR SELECT USING (true);
CREATE POLICY "Admin manage sliders" ON public.sliders FOR ALL USING (is_admin());
