import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

// Initialize Supabase client for standard users
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storageKey: 'sb-user-token' }
});

// Initialize dedicated Supabase client for admins to provide instance isolation
export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storageKey: 'sb-admin-token' }
});

// Initialize dedicated Supabase client for mentors to provide instance isolation
export const mentorSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storageKey: 'sb-mentor-token' }
});
