"use client";

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';

export default function LeadTracker() {
    const { supabaseClient: supabase, user, profile } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        const trackVisit = async () => {
            // Get or create fingerprint
            let fingerprint = localStorage.getItem('site_lead_fingerprint');
            if (!fingerprint) {
                fingerprint = window.crypto.randomUUID();
                localStorage.setItem('site_lead_fingerprint', fingerprint);
            }

            const leadData: any = {
                fingerprint,
                last_page_visited: pathname,
                updated_at: new Date().toISOString(),
            };

            if (user) {
                leadData.user_id = user.id;
                leadData.email = user.email;
                // Use metadata as initial source
                leadData.name = user.user_metadata?.full_name;
                leadData.phone = user.user_metadata?.phone;
                leadData.address = user.user_metadata?.address;
            }

            if (profile) {
                // Profile table data takes precedence
                leadData.name = profile.full_name || leadData.name;
                leadData.phone = profile.phone || leadData.phone;
                leadData.address = profile.address || leadData.address;
            }

            // Upsert lead record
            const { error } = await supabase
                .from('site_leads')
                .upsert(leadData, { onConflict: 'fingerprint' });

            if (error) {
                console.error('Error tracking lead:', error);
            }
        };

        // Delay slightly to not block initial render
        const timer = setTimeout(trackVisit, 2000);
        return () => clearTimeout(timer);
    }, [pathname, user, profile, supabase]);

    return null;
}
