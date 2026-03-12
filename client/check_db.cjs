require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const tables = ['mentors', 'bookings', 'contact_queries', 'profiles', 'class_subjects'];
    console.log('--- Table Row Counts ---');
    for (const t of tables) {
        try {
            const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`${t}: Error - ${error.message}`);
            } else {
                console.log(`${t}: ${count} rows`);
            }
        } catch (e) {
            console.log(`${t}: Exception - ${e.message}`);
        }
    }

    console.log('\n--- Recent Bookings (All) ---');
    const { data: bData, error: bError } = await supabase.from('bookings').select('*').limit(5);
    console.log(JSON.stringify(bData || [], null, 2));

    console.log('\n--- Mentors Named Shreya ---');
    const { data: mData } = await supabase.from('mentors').select('*').ilike('name', '%Shreya%');
    console.log(JSON.stringify(mData || [], null, 2));
}

main();
