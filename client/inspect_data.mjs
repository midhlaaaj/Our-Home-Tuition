/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manual parsing since import.meta.env is Vite specific
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

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function main() {
        console.log('Fetching counters...');
        const { data, error } = await supabase
            .from('counters')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching counters:', error);
            return;
        }

        console.log('Counters found:', data.length);
        console.table(data);

        // Check for duplicates based on label (assuming label should be unique per active counter)
        const labelCounts = {};
        const duplicates = [];

        data.forEach(counter => {
            if (counter.is_active) {
                if (labelCounts[counter.label]) {
                    labelCounts[counter.label]++;
                    duplicates.push(counter);
                } else {
                    labelCounts[counter.label] = 1;
                }
            }
        });

        if (duplicates.length > 0) {
            console.log('\nFound active duplicates:');
            console.table(duplicates);

            // Suggest deletion IDs (keep the first one found, delete others?)
            // Or maybe keep the one with lowest ID?
            // Let's just group by label and see
            const groups = {};
            data.filter(c => c.is_active).forEach(c => {
                if (!groups[c.label]) groups[c.label] = [];
                groups[c.label].push(c);
            });

            console.log('\nSuggested actions:');
            Object.entries(groups).forEach(([label, items]) => {
                if (items.length > 1) {
                    // Sort by id to keep creating stability, or created_at if available
                    // Assuming id is uuid or int. If uuid, difficult to know order without created_at
                    // Let's just pick the first one to keep.
                    const toKeep = items[0];
                    const toDelete = items.slice(1);
                    console.log(`Keep ID: ${toKeep.id} for "${label}"`);
                    console.log(`Delete IDs: ${toDelete.map(d => d.id).join(', ')}`);
                }
            });

        } else {
            console.log('\nNo active duplicates found based on label.');
        }
    }

    main();

} catch (err) {
    console.error('Error reading .env or running script:', err);
}
