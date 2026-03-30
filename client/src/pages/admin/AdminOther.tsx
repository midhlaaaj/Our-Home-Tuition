import React from 'react';
import { Link } from 'react-router-dom';
import { FaTrophy, FaUserCircle, FaBookOpen } from 'react-icons/fa';

const AdminOther: React.FC = () => {
    const cards = [
        {
            title: 'Achievements',
            description: 'Manage slide-based achievement displays and platform highlights.',
            icon: <FaTrophy />,
            path: '/admin/achievements',
            color: 'bg-yellow-50 text-yellow-600'
        },
        {
            title: 'Avatars',
            description: 'Update and manage system icons and profile placeholders.',
            icon: <FaUserCircle />,
            path: '/admin/avatars',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            title: 'Blogs',
            description: 'Create and edit blog posts and informative articles.',
            icon: <FaBookOpen />,
            path: '/admin/blogs',
            color: 'bg-rose-50 text-rose-600'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto font-['Urbanist'] animate-in fade-in duration-700">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Other Hub</h1>
                <p className="text-gray-500 mt-2 font-bold text-sm uppercase tracking-widest leading-none">Miscellaneous Management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.path}
                        to={card.path}
                        className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#1B2A5A]/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start gap-6 relative overflow-hidden"
                    >
                        <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity ${card.color.split(' ')[0]}`}></div>
                        
                        <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center text-2xl transition-transform group-hover:scale-110 duration-300`}>
                            {card.icon}
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-blue-900 transition-colors">{card.title}</h3>
                            <p className="text-gray-400 text-sm font-bold leading-relaxed">{card.description}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center gap-2 group-hover:gap-3 transition-all">
                            <span className="text-[10px] font-black text-[#1B2A5A] uppercase tracking-widest">Edit Section</span>
                            <svg className="w-3 h-3 text-[#1B2A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminOther;
