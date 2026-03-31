"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa';

interface ModalOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'alert' | 'confirm' | 'success';
}

interface ModalContextType {
    showAlert: (message: string, title?: string) => Promise<void>;
    showConfirm: (message: string, title?: string, confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
    showSuccess: (message: string, title?: string) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalOptions | null>(null);
    const [resolveRef, setResolveRef] = useState<((value: any) => void) | null>(null);

    const showAlert = (message: string, title: string = 'Notice') => {
        setModal({ message, title, type: 'alert', confirmLabel: 'Got it' });
        return new Promise<void>((resolve) => {
            setResolveRef(() => resolve);
        });
    };

    const showSuccess = (message: string, title: string = 'Success') => {
        setModal({ message, title, type: 'success', confirmLabel: 'Done' });
        return new Promise<void>((resolve) => {
            setResolveRef(() => resolve);
        });
    };

    const showConfirm = (message: string, title: string = 'Confirm Action', confirmLabel: string = 'Confirm', cancelLabel: string = 'Cancel') => {
        setModal({ message, title, type: 'confirm', confirmLabel, cancelLabel });
        return new Promise<boolean>((resolve) => {
            setResolveRef(() => resolve);
        });
    };

    const handleConfirm = () => {
        if (resolveRef) {
            resolveRef(true);
        }
        setModal(null);
        setResolveRef(null);
    };

    const handleCancel = () => {
        if (resolveRef) {
            resolveRef(false);
        }
        setModal(null);
        setResolveRef(null);
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showSuccess }}>
            {children}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={modal.type !== 'confirm' ? handleConfirm : undefined}
                            className="fixed inset-0 bg-black/60"
                        />
                        
                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden font-sans border border-white/20"
                        >
                            <div className="p-8">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${
                                        modal.type === 'confirm' 
                                            ? 'bg-orange-50 text-[#a0522d]' 
                                            : modal.type === 'success'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-[#1B2A5A]/5 text-[#1B2A5A]'
                                    }`}>
                                        {modal.type === 'confirm' ? (
                                            <FaQuestionCircle size={40} />
                                        ) : modal.type === 'success' ? (
                                            <FaCheckCircle size={40} />
                                        ) : (
                                            <FaInfoCircle size={40} />
                                        )}
                                    </div>
                                    
                                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                                        {modal.title}
                                    </h3>
                                    <p className="text-gray-500 leading-relaxed font-semibold text-sm">
                                        {modal.message}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex p-4 gap-3 bg-gray-50/50">
                                {modal.type === 'confirm' && (
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 px-6 py-4 text-sm font-black text-gray-400 hover:text-gray-600 bg-white rounded-2xl transition-all border border-gray-100 hover:border-gray-200 shadow-sm active:scale-95"
                                    >
                                        {modal.cancelLabel}
                                    </button>
                                )}
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-6 py-4 text-sm font-black transition-all rounded-2xl shadow-lg active:scale-95 text-white ${
                                        modal.type === 'confirm' 
                                            ? 'bg-[#a0522d] hover:bg-[#804224] shadow-orange-200' 
                                            : modal.type === 'success'
                                            ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                            : 'bg-[#1B2A5A] hover:bg-[#142044] shadow-blue-200'
                                    }`}
                                >
                                    {modal.confirmLabel}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ModalContext.Provider>
    );
};
