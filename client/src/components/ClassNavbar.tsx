import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { classesData } from '../constants/classesData';

const ClassNavbar: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <nav className="bg-[#282A35] text-white w-full overflow-x-auto scrollbar-hide">
            <div className="flex items-center w-full min-w-max md:min-w-full">
                {classesData.map((cls) => {
                    const isActive = id === cls.id.toString();
                    return (
                        <Link
                            key={cls.id}
                            to={`/class/${cls.id}`}
                            className={`flex-1 text-center px-2 py-3 text-sm font-medium transition-colors hover:bg-gray-700 hover:text-white ${isActive ? 'bg-[#04AA6D] text-white' : 'text-gray-300'
                                }`}
                        >
                            {cls.label.toUpperCase()}
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
};

export default ClassNavbar;
