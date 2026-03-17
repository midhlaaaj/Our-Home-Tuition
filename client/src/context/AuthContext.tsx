import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

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
            console.log("Fetching role for user:", userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
                return null;
            }
            const userRole = data?.role?.toLowerCase() || 'user';
            roleCache.set(userId, userRole);
            return userRole;
        } catch (error) {
            console.error('Error fetching role:', error);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;
        console.log("AuthProvider mounted");

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out, forcing loading to false");
                setLoading(false);
            }
        }, 2000);

        // Get initial session
        const getInitialSession = async () => {
            try {
                console.log("Fetching initial session...");
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error getting session:", error);
                    throw error;
                }

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    console.log("Session fetched", session ? "User found" : "No user");

                    if (session?.user) {
                        fetchRole(session.user.id).then(userRole => {
                            if (mounted) setRole(userRole);
                        });
                    } else {
                        setRole(null);
                    }
                }
            } catch (error) {
                console.error('Error checking auth session:', error);
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
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchRole(session.user.id).then(userRole => {
                    if (mounted) setRole(userRole);
                });
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
