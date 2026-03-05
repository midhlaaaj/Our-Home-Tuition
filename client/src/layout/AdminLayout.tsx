import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTachometerAlt, FaImages, FaStar, FaHandshake, FaSignOutAlt, FaListOl, FaChalkboardTeacher, FaUserCircle, FaThLarge, FaBook, FaQuestionCircle } from 'react-icons/fa';

const AdminLayout: React.FC = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
        { path: '/admin/sliders', icon: <FaImages />, label: 'Hero Section' },
        { path: '/admin/reviews', icon: <FaStar />, label: 'Reviews' },
        { path: '/admin/brands', icon: <FaHandshake />, label: 'Brands' },
        { path: '/admin/mentors', icon: <FaChalkboardTeacher />, label: 'Mentors' },
        { path: '/admin/counters', icon: <FaListOl />, label: 'Counters' },
        { path: '/admin/avatars', icon: <FaUserCircle />, label: 'Avatars' },
        { path: '/admin/partners', icon: <FaThLarge />, label: 'Partner Slides' },
        { path: '/admin/classes', icon: <FaBook />, label: 'Classes' },
        { path: '/admin/faqs', icon: <FaQuestionCircle />, label: 'FAQs' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-6 text-center border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-[#ffb76c]">Admin Panel</h2>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-[#ffb76c] text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-400 hover:bg-gray-700 hover:text-red-300 rounded-lg transition-colors"
                    >
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
