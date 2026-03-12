import React, { useState, useEffect, useRef } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { FaSignOutAlt, FaBell, FaChevronDown, FaUser } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
                    <img src="/logo.png" alt="Our Home Tuition Logo" className="w-20 h-20 object-contain -my-5 ml-1 mr-1" />
                </Link>

                {/* Navigation Links */}
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

                {/* Right Side: Toggle & Auth */}
                <div className="flex items-center space-x-4">
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
                    {user ? (
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                    className={`w-10 h-10 rounded-full bg-[#1B2A5A] border border-white/10 flex items-center justify-center text-white hover:bg-[#142044] transition-all shadow-sm ${isNotificationOpen ? 'ring-2 ring-white/50' : ''}`}
                                >
                                    <FaBell size={18} />
                                </button>

                                {/* Notification Dropdown */}
                                {isNotificationOpen && (
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-[32px] shadow-2xl border border-gray-100 py-6 px-6 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="flex justify-between items-center mb-10">
                                            <h3 className="text-xl font-bold text-[#1B2A5A]">Notifications</h3>
                                            <span className="text-[10px] font-bold bg-[#F3F0FF] text-[#1B2A5A] px-3 py-1 rounded-full uppercase tracking-wider">
                                                0 NEW
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center py-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                                                <FaBell size={28} />
                                            </div>
                                            <h4 className="text-lg font-bold text-[#1B2A5A] mb-2">No new notifications</h4>
                                            <p className="text-sm text-gray-400 text-center leading-relaxed">
                                                We'll let you know when something important happens.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Crown Icon (Premium) Removed */}


                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="h-10 flex items-center gap-3 bg-[#1B2A5A] text-white px-2 pr-4 rounded-full hover:bg-[#142044] transition-all border border-white/10 shadow-sm"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border-2 border-white/50 flex-shrink-0">
                                        {user.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white text-[#1B2A5A] font-bold">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center pr-2">
                                        <span className="text-sm font-bold leading-tight text-white line-clamp-1">
                                            {getDisplayName()}
                                        </span>
                                        <span className="text-[10px] text-[#22c55e] font-bold leading-none mt-0.5 drop-shadow-[0_0_3px_rgba(34,197,94,0.4)]">
                                            {user.user_metadata?.role || "Student"}
                                        </span>
                                    </div>
                                    <FaChevronDown size={12} className={`text-white/80 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Account</p>
                                            <p className="text-sm font-black text-gray-800 truncate">{user.email}</p>
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
                        <div className="flex items-center gap-3">
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
        </header>
    );
};

export default Header;
