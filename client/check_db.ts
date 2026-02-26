import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    // let's try to query some generic table or use a known one
    const { data: sliders, error: e1 } = await supabase.from('sliders').select('*');
    console.log('sliders count:', sliders?.length, e1);

    const { data: mentors, error: e2 } = await supabase.from('mentors').select('*');
    console.log('mentors count:', mentors?.length, e2);

    // how about site_settings?
    const { data: settings, error: e3 } = await supabase.from('site_settings').select('*');
    console.log('site_settings error:', e3);
}

checkTables();
