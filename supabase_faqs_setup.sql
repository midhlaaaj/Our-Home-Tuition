-- Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to faqs" 
    ON public.faqs 
    FOR SELECT 
    USING (true);

-- Create policy to allow admin full access (assuming admin role check is handled or simplified based on existing project structure)
-- Note: Replace 'role = ''admin''' with actual admin check logic if there's a specific auth.users metadata structure used in this project.
-- For simplicity and assuming admin is managing from dashboard, we might rely on Supabase API keys/Dashboard for raw updates first,
-- or basic auth user check if it's a simple app. Let's use a safe basic authenticated update policy for now, 
-- or you can run this block directly in Supabase SQL editor as an admin.
CREATE POLICY "Allow authenticated users full access to faqs" 
    ON public.faqs 
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- Insert some dummy data to start
INSERT INTO public.faqs (question, answer, "order") VALUES
('How do I charge an EV bike?', 'You can charge your EV bike using any standard household power socket. Just plug in the charger, and the bike will begin charging automatically.', 1),
('How much does it cost to charge an EV bike?', 'The cost varies depending on your local electricity rates and the battery size, but it is typically a fraction of the cost of filling up a gas tank.', 2),
('How long does the battery last?', 'Battery life depends on usage and maintenance, but modern EV bike batteries are designed to last for several years or thousands of charge cycles before significant degradation.', 3);
