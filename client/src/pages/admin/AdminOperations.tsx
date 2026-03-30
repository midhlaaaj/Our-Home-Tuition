import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaCalendarCheck, FaInbox, FaStar, FaBriefcase, FaChalkboardTeacher } from 'react-icons/fa';

const AdminOperations: React.FC = () => {
    const cards = [
        {
            title: 'Leads',
            description: 'Manage incoming service inquiries and potential customers.',
            icon: <FaUserPlus />,
            path: '/admin/leads',
            color: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Bookings',
            description: 'Coordinate session schedules and active tutor bookings.',
            icon: <FaCalendarCheck />,
            path: '/admin/bookings',
            color: 'bg-sky-50 text-sky-600'
        },
        {
            title: 'Queries',
            description: 'Handle general contact forms and customer support tickets.',
            icon: <FaInbox />,
            path: '/admin/queries',
            color: 'bg-rose-50 text-rose-600'
        },
        {
            title: 'Reviews',
            description: 'Manage platform-wide reviews and feedback displays.',
            icon: <FaStar />,
            path: '/admin/reviews',
            color: 'bg-amber-50 text-amber-600'
        },
        {
            title: 'Post Jobs',
            description: 'Create and publish new job opportunities for tutors.',
            icon: <FaBriefcase />,
            path: '/admin/jobs',
            color: 'bg-violet-50 text-violet-600'
        },
        {
            title: 'Applications',
            description: 'Review and manage mentor applications and credentials.',
            icon: <FaChalkboardTeacher />,
            path: '/admin/applications',
            color: 'bg-teal-50 text-teal-600'
        },
        {
            title: 'Mentors',
            description: 'Complete mentor profiles and administrative status management.',
            icon: <FaChalkboardTeacher />,
            path: '/admin/mentors',
            color: 'bg-orange-50 text-orange-600'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto font-['Urbanist'] animate-in fade-in duration-700">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Operations Hub</h1>
                <p className="text-gray-500 mt-2 font-bold text-sm uppercase tracking-widest leading-none">Global Workflow Management</p>
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

export default AdminOperations;
