import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: string | null;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use a simple cache to avoid redundant network calls within the same session
const roleCache = new Map<string, string>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRole = async (userId: string) => {
        if (roleCache.has(userId)) return roleCache.get(userId)!;
        
        try {
            const result = await safeFetch(async () => {
                return await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();
            }, { silent: true });

            if (result.error) {
                console.error('Error fetching role:', result.error);
                return null;
            }
            const userRole = result.data?.role?.toLowerCase() || 'user';
            roleCache.set(userId, userRole);
            return userRole;
        } catch (error: any) {
            if (error?.name === 'AbortError') return null;
            console.error('Unexpected error fetching role:', error);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;
        console.log("AuthProvider mounted");

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check taking longer than expected, please wait...");
                // We'll give it more time rather than forcing loading to false immediately
            }
        }, 30000);

        // Get initial session
        const getInitialSession = async () => {
            try {
                const result = await safeFetch(async () => {
                    return await supabase.auth.getSession();
                });

                if (result.error) throw result.error;
                const session = result.data?.session ?? null;

                if (mounted) {
                    setSession(session);
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);

                    if (currentUser) {
                        const userRole = await fetchRole(currentUser.id);
                        if (mounted) setRole(userRole);
                    } else {
                        setRole(null);
                    }
                }
            } catch (error: any) {
                if (error?.name === 'AbortError') return;
                console.error('Final error checking auth session:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        getInitialSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log("Auth state changed:", _event, session?.user?.id);
            if (!mounted) return;

            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                const userRole = await fetchRole(currentUser.id);
                if (mounted) setRole(userRole);
            } else {
                if (mounted) setRole(null);
            }

            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        // State updates handled by onAuthStateChange
    };

    const value = {
        session,
        user,
        role,
        signOut,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
