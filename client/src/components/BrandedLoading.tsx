"use client";

import React from 'react';
import { motion } from 'framer-motion';

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
        sm: { container: 'w-10 h-10', logo: 'w-5 h-5', border: 'border-2' },
        md: { container: 'w-16 h-16', logo: 'w-8 h-8', border: 'border-[3px]' },
        lg: { container: 'w-24 h-24', logo: 'w-12 h-12', border: 'border-4' },
        xl: { container: 'w-32 h-32', logo: 'w-16 h-16', border: 'border-[6px]' }
    };

    const currentSize = sizeMap[size];

    const content = (
        <div className={`relative flex items-center justify-center ${currentSize.container} ${className}`}>
            {/* Revolving Outer Circle */}
            <motion.div 
                className={`absolute inset-0 rounded-full border-t-[#1B2A5A] border-r-transparent border-b-transparent border-l-transparent ${currentSize.border} border-solid`}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <div className={`absolute inset-0 rounded-full border-[#1B2A5A]/5 ${currentSize.border} border-solid`} />
            
            {/* Centered Logo */}
            <div className={`${currentSize.logo} relative z-10 flex items-center justify-center`}>
                <img 
                    src="/newlogo.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain opacity-80"
                />
            </div>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 transition-opacity duration-300 font-['Urbanist']">
                <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default BrandedLoading;
