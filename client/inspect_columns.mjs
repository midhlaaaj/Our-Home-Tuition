import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

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
        console.log('Inspecting contact_queries columns...');
        const { data, error } = await supabase
            .from('contact_queries')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('Actual columns found:', Object.keys(data[0]));
        } else {
            console.log('No data found to inspect columns, but table exists.');
            // Try to get columns via a different trick or just ask user
            const { data: cols, error: colError } = await supabase
                .rpc('get_table_columns', { table_name: 'contact_queries' });
            if (colError) console.log('RPC check failed (expected if not defined)');
        }
    }

    main();

} catch (err) {
    console.error('Error:', err);
}
