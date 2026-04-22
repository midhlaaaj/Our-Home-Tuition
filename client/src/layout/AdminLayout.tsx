"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaListOl, FaThLarge, FaBook, FaBriefcase, FaBars, FaTimes, FaHome, FaCog, FaChevronDown, FaStar, FaHandshake, FaChalkboardTeacher, FaQuestionCircle, FaUserPlus, FaCalendarCheck, FaInbox, FaTrophy, FaUserCircle, FaBookOpen, FaUsers } from 'react-icons/fa';

interface MenuItem {
    path?: string;
    icon: React.ReactNode;
    label: string;
    id?: string;
    children?: { path: string; label: string; icon: React.ReactNode }[];
}

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname() || "";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        router.push('/admin/login');
    };

    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {
            homepage: pathname.startsWith('/admin/homepage'),
            operations: ['/admin/leads', '/admin/bookings', '/admin/queries', '/admin/reviews', '/admin/jobs', '/admin/applications', '/admin/mentors'].some(path => pathname.startsWith(path)),
            other: ['/admin/achievements', '/admin/avatars', '/admin/blogs'].some(path => pathname.startsWith(path))
        };
        return initialState;
    });

    const menuStructure: MenuItem[] = [
        { path: '/admin', icon: <FaThLarge />, label: 'Dashboard' },
        { 
            id: 'homepage',
            path: '/admin/homepage', 
            icon: <FaHome />, 
            label: 'Homepage',
            children: [
                { path: '/admin/homepage/sliders', label: 'Hero Section', icon: <FaThLarge /> },
                { path: '/admin/homepage/counters', label: 'Counters', icon: <FaListOl /> },
                { path: '/admin/homepage/reviews', label: 'Reviews', icon: <FaStar /> },
                { path: '/admin/homepage/brands', label: 'Brands', icon: <FaHandshake /> },
                { path: '/admin/homepage/mentors', label: 'Mentors', icon: <FaChalkboardTeacher /> },
                { path: '/admin/homepage/partners', label: 'Partners', icon: <FaThLarge /> },
                { path: '/admin/homepage/faqs', label: 'FAQs', icon: <FaQuestionCircle /> },
            ]
        },
        { 
            id: 'operations',
            path: '/admin/operations', 
            icon: <FaBriefcase />, 
            label: 'Operations',
            children: [
                { path: '/admin/leads', label: 'Leads', icon: <FaUserPlus /> },
                { path: '/admin/bookings', label: 'Bookings', icon: <FaCalendarCheck /> },
                { path: '/admin/queries', label: 'Queries', icon: <FaInbox /> },
                { path: '/admin/reviews', label: 'Reviews', icon: <FaStar /> },
                { path: '/admin/jobs', label: 'Post Jobs', icon: <FaBriefcase /> },
                { path: '/admin/applications', label: 'Applications', icon: <FaChalkboardTeacher /> },
                { path: '/admin/mentors', label: 'Mentor Access', icon: <FaChalkboardTeacher /> },
                { path: '/admin/mentor-management', label: 'Mentor Management', icon: <FaUsers /> },
            ]
        },
        { path: '/admin/classes', icon: <FaBook />, label: 'Classes' },
        { 
            id: 'other',
            path: '/admin/other', 
            icon: <FaCog />, 
            label: 'Other',
            children: [
                { path: '/admin/achievements', label: 'Achievements', icon: <FaTrophy /> },
                { path: '/admin/avatars', label: 'Avatars', icon: <FaUserCircle /> },
                { path: '/admin/blogs', label: 'Blogs', icon: <FaBookOpen /> },
            ]
        },
    ];

    const getActiveLabel = () => {
        for (const item of menuStructure) {
            if (item.path === pathname) return item.label;
            
            if (item.children) {
                const child = item.children.find(c => c.path === pathname);
                if (child) return child.label;
            }

            if (item.path !== '/admin' && pathname.startsWith(item.path || '')) {
                return item.label;
            }
        }
        return 'Overview';
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const isPathActive = (path: string) => {
        if (path === '/admin') return pathname === path;
        return pathname.startsWith(path);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-['Urbanist']">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-72 bg-[#1F2937] text-white flex flex-col shadow-2xl z-40 lg:relative lg:translate-x-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <img src="/newlogo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-white">Admin<span className="text-[#ffb76c]">Hub</span></h2>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Management</p>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="lg:hidden text-white/40 hover:text-white transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <nav className="flex-grow p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                    {menuStructure.map((item) => (
                        <div key={item.label}>
                            <div className="relative group">
                                <Link
                                    href={item.path || '#'}
                                    onClick={() => {
                                        setIsSidebarOpen(false);
                                        if (item.children && item.id) {
                                            setExpandedMenus(prev => ({ ...prev, [item.id!]: !prev[item.id!] }));
                                        }
                                    }}
                                    className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 ${isPathActive(item.path || '')
                                        ? 'bg-[#ffb76c] text-[#1B2A5A] shadow-lg shadow-[#ffb76c]/20 font-black scale-[1.02]'
                                        : 'text-white/90 hover:bg-white/10 hover:text-white font-bold'
                                        }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className={`text-xl transition-all duration-300 group-hover:scale-110 ${isPathActive(item.path || '') ? 'text-[#1B2A5A]' : 'text-[#ffb76c] group-hover:text-white'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-sm tracking-wide">{item.label}</span>
                                    </div>
                                    
                                    {item.children && (
                                        <div className={`transition-transform duration-300 ${expandedMenus[item.id!] ? 'rotate-180' : ''}`}>
                                            <FaChevronDown size={14} className={isPathActive(item.path || '') ? 'text-[#1B2A5A]' : 'text-white/40'} />
                                        </div>
                                    )}
                                </Link>
                            </div>

                            {item.children && expandedMenus[item.id!] && (
                                <div className="pl-6 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    {item.children.map((child) => (
                                        <Link
                                            key={child.path}
                                            href={child.path}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-300 group ${pathname === child.path
                                                ? 'bg-white/10 text-[#ffb76c] font-black'
                                                : 'text-white/50 hover:bg-white/5 hover:text-white font-semibold'
                                                }`}
                                        >
                                            <span className={`text-sm ${pathname === child.path ? 'text-[#ffb76c]' : 'text-white/20 group-hover:text-[#ffb76c]'}`}>
                                                {child.icon}
                                            </span>
                                            <span className="text-xs">{child.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-6 mt-auto">
                    <div className="h-px bg-white/10 mb-6 mx-4"></div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-4 px-5 py-4 w-full text-red-200/60 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all font-bold group"
                    >
                        <FaSignOutAlt size={18} className="text-red-500/40 group-hover:text-red-500" />
                        <span className="text-sm">Logout Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Fixed Premium Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 lg:hidden text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FaBars size={20} />
                        </button>
                        <div className="hidden lg:block w-1.5 h-8 bg-[#ffb76c] rounded-full"></div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                                {getActiveLabel()}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">Chief Editor</span>
                            <span className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                                Live Sync
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B2A5A] to-[#ffb76c] flex items-center justify-center text-white font-black text-sm shadow-md">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50/50">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
