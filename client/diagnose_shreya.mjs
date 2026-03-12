import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), '.env');

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            env[key] = value;
        }
    });

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function main() {
        console.log('--- 1. Checking Mentor "Shreya" ---');
        const { data: mentors, error: mError } = await supabase
            .from('mentors')
            .select('*')
            .ilike('name', '%Shreya%');
        
        if (mError) {
            console.error('Error fetching mentors:', mError);
        } else {
            console.log('Mentors found:', mentors.length);
            console.table(mentors);
        }

        if (mentors && mentors.length > 0) {
            const shreya = mentors[0];
            console.log(`\n--- 2. Checking Bookings assigned to Shreya (ID: ${shreya.id}) ---`);
            const { data: bookings, error: bError } = await supabase
                .from('bookings')
                .select('*')
                .eq('assigned_mentor_id', shreya.id);
            
            if (bError) {
                console.error('Error fetching bookings:', bError);
            } else {
                console.log('Bookings assigned:', bookings.length);
                console.table(bookings.map(b => ({
                    id: b.id,
                    status: b.status,
                    student: b.primary_student?.name,
                    mentor_id: b.assigned_mentor_id
                })));
            }

            console.log(`\n--- 3. Checking Profile for auth_user_id: ${shreya.auth_user_id} ---`);
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', shreya.auth_user_id)
                .single();
            
            if (pError) {
                console.error('Error fetching profile:', pError);
            } else {
                console.log('Profile found:');
                console.table(profile);
            }
        }

        console.log('\n--- 4. Checking All Recent Bookings (unassigned or recently assigned) ---');
        const { data: recent, error: rError } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (rError) {
            console.error('Error fetching recent bookings:', rError);
        } else {
            console.log('Recent bookings:');
            console.table(recent.map(b => ({
                id: b.id,
                status: b.status,
                mentor_id: b.assigned_mentor_id,
                created_at: b.created_at
            })));
        }
    }

    main();

} catch (err) {
    console.error('Error:', err);
}
