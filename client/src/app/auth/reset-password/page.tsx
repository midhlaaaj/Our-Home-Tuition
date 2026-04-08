"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const { supabaseClient: supabase } = useAuth();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    // Simple session check - though Supabase handles the recovery token behind the scenes
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            // If there's no session and we're on this page, it might be an invalid link or expired
            // But we'll let the update password call handle the error for more precision
        };
        checkSession();
    }, [supabase]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (error: any) {
            setErrors({ auth: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-16 flex items-center justify-center mb-6">
                        <img src="/brand-logo.png" alt="Hour Home" className="w-full h-full object-contain scale-150" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Reset Password
                    </h2>
                    <p className="text-sm font-bold text-[#1B2A5A] mt-1 uppercase tracking-widest text-[10px]">
                        Secure your account with a new password
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="flex justify-center mb-4">
                                <FaCheckCircle size={64} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h3>
                            <p className="text-gray-500">Your password has been changed successfully. Redirecting you home...</p>
                        </motion.div>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            {errors.auth && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-500 text-sm font-bold rounded-xl text-center">
                                    {errors.auth}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
                                        <FaLock size={14} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-100'} rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-500 font-bold">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
                                        <FaLock size={14} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-100'} rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm`}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-bold">{errors.confirmPassword}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="w-full bg-[#1B2A5A] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#142044] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/10"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                                <FaArrowRight size={14} />
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
