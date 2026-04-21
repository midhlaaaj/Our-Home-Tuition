
const { createClient } = require('@supabase/supabase-base');
require('dotenv').config({ path: './client/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTopics() {
    const { data, error } = await supabase
        .from('class_topics')
        .select('name, unit_no')
        .in('name', ['GREETINGS', 'ALPHABET RECOGNITION']);
    
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

checkTopics();
