import React from 'react';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';

const AIChatButton: React.FC = () => {
    return (
        <motion.div 
            className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
        >
            <div className="relative group">
                <button 
                    className="w-12 h-12 bg-gradient-to-br from-[#1B2A5A] to-[#2D458E] rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-blue-900/30 transition-shadow duration-300 relative overflow-hidden"
                    onClick={() => alert("AI Support Coming Soon!")}
                    aria-label="AI Support Chat"
                >
                    <IoChatbubbleEllipsesOutline size={24} />
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                </button>

                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-3 px-3 py-1 bg-[#1B2A5A] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-xl">
                    AI Support
                </div>
            </div>
        </motion.div>
    );
};

export default AIChatButton;
