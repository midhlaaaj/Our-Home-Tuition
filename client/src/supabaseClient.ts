import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

// Generate a unique ID for this tab session if it doesn't exist.
// This ensures that different tabs use different storage slots,
// preventing them from overwriting each other or syncing via BroadcastChannel.
let tabId = sessionStorage.getItem('supabase_tab_id');
if (!tabId) {
    tabId = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('supabase_tab_id', tabId);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: `sb-${tabId}-auth-token`,
        storage: window.sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
