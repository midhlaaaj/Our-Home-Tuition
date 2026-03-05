import React from 'react';
import { FiBookOpen } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { Link } from 'react-router-dom';

const classesData = Array.from({ length: 10 }, (_, i) => ({
    title: `Class ${i + 1}`,
    subtitle: 'View subjects and book a tutor',
    href: `/class/${i + 1}`,
    Icon: FiBookOpen
}));

const BrowseClasses: React.FC = () => {
    return (
        <section className="py-12">
            <div className="max-w-[85%] 2xl:max-w-[1400px] mx-auto bg-[#fff6f0] rounded-3xl shadow-sm px-4 sm:px-8 py-16 lg:px-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                        Browse Classes
                    </h2>
                    <p className="max-w-3xl mx-auto text-lg text-gray-500">
                        Explore structured learning paths for students from Class 1 to Class 10. Select a class to view subjects, choose the specific units you need help with, and book a tutor for personalized home tuition at your home.
                    </p>
                </div>

                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {classesData.map((cls, idx) => (
                        <Card
                            key={idx}
                            title={cls.title}
                            subtitle={cls.subtitle}
                            href={cls.href}
                            Icon={cls.Icon}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

interface CardProps {
    title: string;
    subtitle: string;
    Icon: IconType;
    href: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, Icon, href }) => {
    return (
        <Link
            to={href}
            className="w-full p-4 rounded-xl border-[1px] border-orange-200 relative overflow-hidden group bg-white flex flex-col items-start block shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            <div className="absolute inset-0 bg-[#c75e33] translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />

            <Icon className="mb-2 text-2xl text-[#c75e33] group-hover:text-white transition-colors relative z-10 duration-300" />
            <h3 className="font-medium text-lg text-slate-900 group-hover:text-white relative z-10 duration-300">
                {title}
            </h3>
            <p className="text-sm text-slate-600 group-hover:text-orange-100 relative z-10 duration-300 mt-1">
                {subtitle}
            </p>
        </Link>
    );
};

export default BrowseClasses;
