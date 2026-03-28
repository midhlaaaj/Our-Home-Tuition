import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: any | null;
    role: string | null;
    signOut: () => Promise<void>;
    loading: boolean;
    supabaseClient: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use a simple cache to avoid redundant network calls within the same session
const roleCache = new Map<string, string>();

export const AuthProvider: React.FC<{ children: React.ReactNode, supabaseClient?: any }> = ({ 
    children, 
    supabaseClient = supabase // fallback to default
}) => {
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const userRef = React.useRef<User | null>(null);
    const sessionRef = React.useRef<Session | null>(null);
    const roleRef = React.useRef<string | null>(null);
    const profileRef = React.useRef<any | null>(null);

    // Sync refs with state
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { sessionRef.current = currentSession; }, [currentSession]);
    useEffect(() => { roleRef.current = role; }, [role]);
    useEffect(() => { profileRef.current = profile; }, [profile]);

    const fetchProfileData = async (userId: string) => {
        try {
            const result = await safeFetch(async () => {
                return await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
            }, { silent: true });

            if (result.error) {
                console.error('Error fetching profile:', result.error);
                return null;
            }
            return result.data;
        } catch (error: any) {
            console.error('Unexpected error fetching profile:', error);
            return null;
        }
    };

    const fetchRole = async (userId: string) => {
        if (roleCache.has(userId)) return roleCache.get(userId)!;
        
        try {
            const result = await safeFetch(async () => {
                return await supabaseClient
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

        // Get initial session
        const getInitialSession = async () => {
            try {
                const result = await safeFetch(async () => {
                    return await supabaseClient.auth.getSession();
                });

                if (result.error) throw result.error;
                const session = result.data?.session ?? null;

                if (mounted) {
                    setCurrentSession(session);
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);

                    if (currentUser) {
                        const [userRole, profileData] = await Promise.all([
                            fetchRole(currentUser.id),
                            fetchProfileData(currentUser.id)
                        ]);
                        if (mounted) {
                            setRole(userRole);
                            setProfile(profileData);
                        }
                    } else {
                        setRole(null);
                        setProfile(null);
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
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: string, session: Session | null) => {
            console.log("AuthContext: Auth state changed event:", _event, "User:", session?.user?.email);
            if (!mounted) return;

            // Handle the state change in a non-blocking background process
            const handleStateChange = async () => {
                try {
                    const currentUser = session?.user ?? null;

                    // 1. Session & User Check: Only update if IDs change
                    const currentUserId = userRef.current?.id;
                    if (currentUser?.id !== currentUserId) {
                        setCurrentSession(session);
                        setUser(currentUser);
                        // If user actually changed, we definitely need a loading state
                        setLoading(true);
                    } else if (session?.access_token !== sessionRef.current?.access_token) {
                        // Just a token refresh, but same user
                        setCurrentSession(session);
                        console.log("AuthContext: Silent token sync");
                    }

                    if (currentUser) {
                        const [userRole, profileData] = await Promise.all([
                            fetchRole(currentUser.id),
                            fetchProfileData(currentUser.id)
                        ]);
                        
                        if (mounted) {
                            // 2. Role & Profile Check: Only update if data is truly new
                            if (userRole !== roleRef.current) setRole(userRole);
                            
                            // Simple shallow check for profile (ID + Updated timestamp)
                            const isProfileSame = profileData?.id === profileRef.current?.id && 
                                                 profileData?.updated_at === profileRef.current?.updated_at;
                            
                            if (!isProfileSame) {
                                setProfile(profileData);
                            }
                        }
                    } else {
                        if (mounted) {
                            setRole(null);
                            setProfile(null);
                        }
                    }
                } catch (error) {
                    console.error("AuthContext: Error in handleStateChange:", error);
                } finally {
                    if (mounted) setLoading(false);
                }
            };

            handleStateChange();
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabaseClient]);


    const signOut = async () => {
        await supabaseClient.auth.signOut();
        // State updates handled by onAuthStateChange
    };

    const value = {
        session: currentSession,
        user,
        profile,
        role,
        signOut,
        loading,
        supabaseClient
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
