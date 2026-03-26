import React, { useState, useEffect, useRef } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { FaSignOutAlt, FaBell, FaChevronDown, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

import SignIn from './SignIn';

interface HeaderProps {
    bgClass?: string;
    showToggle?: boolean;
}

const Header: React.FC<HeaderProps> = ({ bgClass, showToggle = true }) => {
    const { curriculum, toggleCurriculum } = useCurriculum();
    const { user, signOut } = useAuth();
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const getDisplayName = () => {
        const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
        const parts = rawName.trim().split(/\s+/);

        if (rawName.length >= 8 && rawName.length <= 10) return rawName;

        if (parts.length >= 2) {
            const firstMiddle = `${parts[0]} ${parts[1]}`;
            if (firstMiddle.length >= 8 && firstMiddle.length <= 10) return firstMiddle;
        }

        return parts[0];
    };

    const handleSignOut = async () => {
        await signOut();
        setIsProfileOpen(false);
    };

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        if (isProfileOpen || isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen, isNotificationOpen]);


    // Notifications Logic
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev].slice(0, 10));
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            // Visibility logic - always show the header as sticky throughout the website
            setIsHeaderVisible(true);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ease-in-out transform ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
                } ${bgClass ? bgClass : 'bg-white shadow-md border-b border-gray-100'
                }`}
        >
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-0">
                    <img src="/newlogo.png" alt="Our Home Tuition Logo" className="w-20 h-20 object-contain -my-5 ml-1 mr-1" />
                </Link>

                {/* Navigation Links - Desktop */}
                <nav className="hidden md:flex items-center space-x-16 ml-auto mr-12">
                    {[
                        { name: 'Home', path: '/' },
                        { name: 'Classes', path: '/class/1' },
                        { name: 'Career', path: '/career' },
                        { name: 'About Us', path: '/about' }
                    ].map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`relative font-medium text-lg tracking-wide group py-2 transition-colors duration-200 ${isActive ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-200"></span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile Right Controls: Notification & Hamburger */}
                <div className="md:hidden flex items-center space-x-2 ml-auto">
                    {/* Notification Bell - Mobile (Only for Logged in Users) */}
                    {user && (
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`w-10 h-10 rounded-full bg-[#1B2A5A] flex items-center justify-center text-white transition-all shadow-sm active:scale-95 ${isNotificationOpen ? 'ring-2 ring-white/50' : ''}`}
                                aria-label="Notifications"
                            >
                                <FaBell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Notification Dropdown */}
                            {isNotificationOpen && (
                                <div className="fixed top-20 right-4 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-[24px] shadow-2xl border border-gray-100 p-0 z-[110] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden md:hidden">
                                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-[#1B2A5A]/5">
                                        <h3 className="text-sm font-black text-[#1B2A5A]">NOTIFICATIONS</h3>
                                        <span className="text-[9px] font-black bg-[#1B2A5A] text-white px-2 py-0.5 rounded-full">
                                            {unreadCount} NEW
                                        </span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto px-1 py-1 custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div 
                                                    key={n.id} 
                                                    className={`p-3 rounded-xl mb-1 ${n.is_read ? 'bg-white' : 'bg-blue-50/30 border-l-2 border-blue-500'}`}
                                                >
                                                    <p className="text-[11px] font-black text-gray-900 leading-tight">{n.title}</p>
                                                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 flex flex-col items-center">
                                                <FaBell className="text-gray-200 mb-2" size={20} />
                                                <p className="text-[11px] font-bold text-gray-400">No new alerts</p>
                                            </div>
                                        )}
                                    </div>
                                    <Link 
                                        to="/notifications" 
                                        onClick={() => setIsNotificationOpen(false)}
                                        className="block py-3 text-center text-[10px] font-black text-[#1B2A5A] bg-gray-50 hover:bg-gray-100 transition-colors uppercase tracking-widest border-t border-gray-100"
                                    >
                                        View All
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-12 h-12 flex items-center justify-center transition-all z-[120] relative"
                        aria-label="Toggle Mobile Menu"
                    >
                        <div className={`transition-all duration-500 transform ${isMobileMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'} text-[#1B2A5A]`}>
                            <FaBars size={28} />
                        </div>
                        <div className={`absolute transition-all duration-500 transform ${isMobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'} text-[#a0522d]`}>
                            <FaTimes size={32} />
                        </div>
                    </button>
                </div>

                {/* Right Side: Toggle & Auth - Desktop Only */}
                <div className="hidden md:flex items-center space-x-4">
                    {/* Toggle Button */}
                    {showToggle && location.pathname.startsWith('/class') && (
                        <button
                            onClick={toggleCurriculum}
                            className="relative w-32 h-10 bg-[#1B2A5A] rounded-full flex items-center p-1 cursor-pointer shadow-inner overflow-hidden border border-white/10"
                            aria-label="Toggle Curriculum"
                        >
                            {/* Background Text Labels */}
                            <div className="absolute w-full flex justify-between px-3 text-xs font-bold text-white/50 pointer-events-none select-none">
                                <span>CBSE</span>
                                <span>STATE</span>
                            </div>

                            {/* Slider Knob */}
                            <div
                                className={`w-1/2 h-full bg-white rounded-full shadow-md text-[#1B2A5A] flex items-center justify-center text-xs font-bold transition-transform duration-300 ease-in-out ${curriculum === 'STATE' ? 'translate-x-full' : 'translate-x-0'
                                    }`}
                            >
                                {curriculum}
                            </div>
                        </button>
                    )}

                    {/* Auth Section */}
                    {/* Notification Bell - Desktop (Only for Logged in Users) */}
                    {user && (
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`w-10 h-10 rounded-full bg-[#1B2A5A] border border-white/10 flex items-center justify-center text-white hover:bg-[#142044] transition-all shadow-sm ${isNotificationOpen ? 'ring-2 ring-white/50' : ''}`}
                            >
                                <FaBell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-gray-100 pt-6 pb-0 px-0 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                                    <div className="flex justify-between items-center mb-6 px-6">
                                        <h3 className="text-xl font-bold text-[#1B2A5A]">Notifications</h3>
                                        <div className="flex items-center gap-3">
                                            {unreadCount > 0 && (
                                                <button onClick={markAllAsRead} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700">
                                                    Mark All Read
                                                </button>
                                            )}
                                            <span className="text-[10px] font-bold bg-[#F3F0FF] text-[#1B2A5A] px-3 py-1 rounded-full uppercase tracking-wider">
                                                {unreadCount} NEW
                                            </span>
                                        </div>
                                    </div>

                                    <div className="max-h-[350px] overflow-y-auto px-2 custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            <div className="space-y-1 pb-4">
                                                {notifications.map((n) => (
                                                    <div 
                                                        key={n.id} 
                                                        className={`p-4 rounded-2xl transition-all border-l-4 ${n.is_read ? 'bg-white border-transparent' : 'bg-blue-50/50 border-blue-500'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-black text-gray-900 leading-tight">{n.title}</p>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center py-10 px-6">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                                                    <FaBell size={28} />
                                                </div>
                                                <h4 className="text-lg font-bold text-[#1B2A5A] mb-2">No notifications</h4>
                                                <p className="text-sm text-gray-400 text-center leading-relaxed">
                                                    We'll let you know when something important happens.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="px-6 pb-5 pt-3 flex justify-center border-t border-gray-50 bg-gray-50/30">
                                            <Link 
                                                to="/notifications" 
                                                onClick={() => setIsNotificationOpen(false)}
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-[#1B2A5A] transition-all"
                                            >
                                                View All Messages
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Auth Section */}
                    {user ? (
                        <div className="flex items-center gap-4">
                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="h-10 flex items-center gap-3 bg-[#1B2A5A] text-white px-2 pr-4 rounded-full hover:bg-[#142044] transition-all border border-white/10 shadow-sm"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border-2 border-white/50 flex-shrink-0">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white text-[#1B2A5A] font-bold">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center pr-2">
                                        <span className="text-sm font-bold leading-tight text-white line-clamp-1">
                                            {getDisplayName()}
                                        </span>
                                        <span className="text-[10px] text-[#22c55e] font-bold leading-none mt-0.5 drop-shadow-[0_0_3px_rgba(34,197,94,0.4)]">
                                            {user?.user_metadata?.role || "Student"}
                                        </span>
                                    </div>
                                    <FaChevronDown size={12} className={`text-white/80 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Account</p>
                                            <p className="text-sm font-black text-gray-800 truncate">{user?.email}</p>
                                        </div>

                                        <Link
                                            to="/profile"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-gray-600 hover:text-[#a0522d] hover:bg-orange-50 transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center">
                                                <FaUser size={14} />
                                            </div>
                                            View Profile
                                        </Link>

                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all border-t border-gray-50 mt-2 pt-4"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center">
                                                <FaSignOutAlt size={14} />
                                            </div>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => { setAuthView('signin'); setIsAuthModalOpen(true); }}
                                className="border border-[#1B2A5A] text-[#1B2A5A] px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#1B2A5A] hover:text-white transition-all"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setAuthView('signup'); setIsAuthModalOpen(true); }}
                                className="bg-[#1B2A5A] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#142044] transition-all shadow-md"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <SignIn isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authView} />

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <>
                    {/* Dark Backdrop - Very subtle dimming */}
                    <div 
                        className="fixed inset-0 bg-black/5 z-[100] animate-in fade-in duration-300 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* Drawer Content - Compact solid panel, Urbanist fonts */}
                    <div className="fixed top-0 right-0 h-screen w-[65%] max-w-[280px] bg-white z-[105] shadow-[-15px_0_35px_rgba(0,0,0,0.08)] animate-in slide-in-from-right duration-500 md:hidden flex flex-col pt-24">
                        
                        {/* Navigation List - Clean Urbanist Style */}
                        <div className="flex-1 px-8">
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'Classes', path: '/class/1' },
                                { name: 'About Us', path: '/about' },
                                { name: 'Career', path: '/career' }
                            ].map((link) => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <div key={link.name} className="flex flex-col">
                                        <Link
                                            to={link.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`py-5 text-lg font-black transition-all ${isActive ? 'text-[#a0522d]' : 'text-[#1B2A5A]/70 hover:text-[#1B2A5A]'}`}
                                        >
                                            {link.name}
                                        </Link>
                                        <div className="h-[1px] w-full bg-gray-50" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bottom Profile Section - Brand Colors */}
                        <div className="p-8 bg-white border-t border-gray-50 mt-auto">
                            {user ? (
                                <div className="flex items-center gap-4 group">
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="relative"
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#1B2A5A]/10 flex items-center justify-center bg-white shadow-sm transition-transform group-hover:scale-110">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white text-[#1B2A5A] font-black text-lg">
                                                    {user?.email?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-bounce shadow-md z-10">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link 
                                            to="/profile"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block"
                                        >
                                            <h4 className="text-sm font-black text-[#1B2A5A] leading-tight truncate hover:text-[#a0522d] transition-colors uppercase tracking-tight">
                                                {getDisplayName()}
                                            </h4>
                                            <p className="text-[10px] text-[#22c55e] font-black leading-none mt-1 uppercase tracking-widest drop-shadow-[0_0_2px_rgba(34,197,94,0.3)]">
                                                {user?.user_metadata?.role || "Student"}
                                            </p>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => { setAuthView('signin'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-4 cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1B2A5A] transition-transform group-hover:scale-110">
                                        <FaUser size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-[#1B2A5A] leading-tight mb-0.5">Sign In</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">My Account</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </header>
    );
};

export default Header;
