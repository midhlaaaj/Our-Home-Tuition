import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production') {
        console.error('Supabase URL and Anon Key must be defined in environment variables for production.');
    }
}

const finalUrl = supabaseUrl || '';
const finalKey = supabaseAnonKey || '';

// Initialize Supabase client for standard users
export const supabase = createClient(finalUrl, finalKey, {
    auth: { storageKey: 'sb-user-token' }
});

// Initialize dedicated Supabase client for admins to provide instance isolation
export const adminSupabase = createClient(finalUrl, finalKey, {
    auth: { storageKey: 'sb-admin-token' }
});

// Initialize dedicated Supabase client for mentors to provide instance isolation
export const mentorSupabase = createClient(finalUrl, finalKey, {
    auth: { storageKey: 'sb-mentor-token' }
});
