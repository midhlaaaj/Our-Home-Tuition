import React from 'react';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';

const AIChatButton: React.FC = () => {
    return (
        <motion.div 
            className="fixed bottom-6 right-6 z-[9999]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <button 
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-blue-500/50 transition-shadow duration-300 group relative overflow-hidden"
                onClick={() => alert("AI Support Coming Soon! This will be integrated with Gemini for customer service.")}
                aria-label="AI Support Chat"
            >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon */}
                <IoChatbubbleEllipsesOutline size={32} className="relative z-10" />
                
                {/* Ripple Effect Background */}
                <span className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-500 ease-out" />
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                AI Support
            </div>
        </motion.div>
    );
};

export default AIChatButton;
