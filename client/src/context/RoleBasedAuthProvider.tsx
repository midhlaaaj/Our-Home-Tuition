"use client";

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthContext';
import { supabase, adminSupabase, mentorSupabase } from '../supabaseClient';

export const RoleBasedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname() || '';

    const activeClient = useMemo(() => {
        if (pathname.startsWith('/admin')) {
            return adminSupabase;
        } else if (pathname.startsWith('/mentor')) {
            return mentorSupabase;
        }
        return supabase;
    }, [pathname]);

    // We use the activeClient's internal storage key as the React key
    // This forces the entire AuthProvider (and deeply nested state) to unmount
    // and remount cleanly when the user navigates between different access zones
    // (e.g., from the public site to the admin dashboard), ensuring complete isolation.
    const providerKey = pathname.startsWith('/admin') 
        ? 'admin' 
        : pathname.startsWith('/mentor') 
            ? 'mentor' 
            : 'user';

    return (
        <AuthProvider key={providerKey} supabaseClient={activeClient}>
            {children}
        </AuthProvider>
    );
};
