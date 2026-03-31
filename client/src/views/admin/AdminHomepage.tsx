"use client";

import React from 'react';
import Link from 'next/link';
import { FaImages, FaListOl, FaStar, FaHandshake, FaChalkboardTeacher, FaThLarge, FaQuestionCircle } from 'react-icons/fa';

const AdminHomepage: React.FC = () => {
    const cards = [
        {
            title: 'Hero Section',
            description: 'Manage the main slider, subtitles, and welcome media.',
            icon: <FaImages />,
            path: '/admin/homepage/sliders',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Counters',
            description: 'Update the achievement statistics and platform metrics.',
            icon: <FaListOl />,
            path: '/admin/homepage/counters',
            color: 'bg-green-50 text-green-600'
        },
        {
            title: 'Reviews',
            description: 'Manage platform-wide reviews and feedback displays.',
            icon: <FaStar />,
            path: '/admin/homepage/reviews',
            color: 'bg-yellow-50 text-yellow-600'
        },
        {
            title: 'Brands',
            description: 'Update collaborating brands and company logos.',
            icon: <FaHandshake />,
            path: '/admin/homepage/brands',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            title: 'Mentors',
            description: 'Featured mentors shown on the landing page.',
            icon: <FaChalkboardTeacher />,
            path: '/admin/homepage/mentors',
            color: 'bg-red-50 text-red-600'
        },
        {
            title: 'Partner Slides',
            description: 'Manage the scrolling partner and affiliate slider.',
            icon: <FaThLarge />,
            path: '/admin/homepage/partners',
            color: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'FAQs',
            description: 'Configure frequently asked questions for the home page.',
            icon: <FaQuestionCircle />,
            path: '/admin/homepage/faqs',
            color: 'bg-orange-50 text-orange-600'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto font-['Urbanist'] animate-in fade-in duration-700">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Homepage Hub</h1>
                <p className="text-gray-500 mt-2 font-bold text-sm uppercase tracking-widest leading-none">Global Site Presence Management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.path}
                        href={card.path}
                        className="group bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#1B2A5A]/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start gap-6 relative overflow-hidden"
                    >
                        {/* Decorative background circle */}
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

export default AdminHomepage;
