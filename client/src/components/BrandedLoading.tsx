"use client";

import React from 'react';

interface BrandedLoadingProps {
    fullPage?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const BrandedLoading: React.FC<BrandedLoadingProps> = ({ 
    fullPage = false, 
    size = 'md',
    className = ''
}) => {
    const sizeMap = {
        sm: { container: 'w-16 h-16', logo: 24, border: 'border-2' },
        md: { container: 'w-24 h-24', logo: 40, border: 'border-4' },
        lg: { container: 'w-32 h-32', logo: 56, border: 'border-4' },
        xl: { container: 'w-48 h-48', logo: 80, border: 'border-8' }
    };

    const currentSize = sizeMap[size];

    const content = (
        <div className={`relative flex items-center justify-center ${currentSize.container} ${className}`}>
            {/* Revolving Outer Circle */}
            <div className={`absolute inset-0 rounded-full border-t-[#a0522d] border-r-transparent border-b-transparent border-l-transparent animate-spin ${currentSize.border} border-solid`}></div>
            <div className={`absolute inset-0 rounded-full border-gray-100/30 ${currentSize.border} border-solid`}></div>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300">
                {content}
            </div>
        );
    }

    return content;
};

export default BrandedLoading;
