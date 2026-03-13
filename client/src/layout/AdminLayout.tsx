import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaInbox, FaImages, FaStar, FaHandshake, FaSignOutAlt, FaListOl, FaChalkboardTeacher, FaUserCircle, FaThLarge, FaBook, FaTrophy, FaBriefcase, FaBars, FaTimes, FaCalendarCheck } from 'react-icons/fa';

const AdminLayout: React.FC = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const menuItems = [
        { path: '/admin', icon: <FaThLarge />, label: 'Dashboard' },
        { path: '/admin/queries', icon: <FaInbox />, label: 'Queries' },
        { path: '/admin/bookings', icon: <FaCalendarCheck />, label: 'Bookings' },
        { path: '/admin/sliders', icon: <FaImages />, label: 'Hero Section' },
        { path: '/admin/reviews', icon: <FaStar />, label: 'Reviews' },
        { path: '/admin/brands', icon: <FaHandshake />, label: 'Brands' },
        { path: '/admin/mentors', icon: <FaChalkboardTeacher />, label: 'Mentors' },
        { path: '/admin/classes', icon: <FaBook />, label: 'Classes' },
        { path: '/admin/jobs', icon: <FaBriefcase />, label: 'Post Jobs' },
        { path: '/admin/applications', icon: <FaChalkboardTeacher />, label: 'Applications' },
        { path: '/admin/partners', icon: <FaThLarge />, label: 'Partner Slides' },
        { path: '/admin/achievements', icon: <FaTrophy />, label: 'Achievements' },
        { path: '/admin/avatars', icon: <FaUserCircle />, label: 'Avatars' },
        { path: '/admin/counters', icon: <FaListOl />, label: 'Counters' },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
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

                <nav className="flex-grow p-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${location.pathname === item.path
                                ? 'bg-[#ffb76c] text-[#1B2A5A] shadow-lg shadow-[#ffb76c]/20 font-black scale-[1.02]'
                                : 'text-white/90 hover:bg-white/10 hover:text-white font-bold'
                                }`}
                        >
                            <span className={`text-xl transition-all duration-300 group-hover:scale-110 ${location.pathname === item.path ? 'text-[#1B2A5A]' : 'text-[#ffb76c] group-hover:text-white'}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
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
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <FaBars size={20} />
                        </button>
                        <div className="hidden lg:block w-1.5 h-8 bg-[#ffb76c] rounded-full"></div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                                {menuItems.find(item => location.pathname === item.path)?.label || 'Overview'}
                            </h2>
                        </div>
                    </div>

                    {/* Redirection logo removed */}
                </header>

                {/* Content with proper padding and background */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-10">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
