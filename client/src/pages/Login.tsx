import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFingerprint, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const userRole = (profile?.role || '').toLowerCase();

                if (userRole === 'admin') {
                    navigate('/admin');
                } else if (userRole === 'mentor') {
                    setError('This login is for staff only. Please use the Mentor Portal.');
                    await supabase.auth.signOut();
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            setError('An unexpected system error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50/50 relative overflow-hidden font-['Urbanist']">
            {/* Soft Background Gradients */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1B2A5A]/5 rounded-full blur-[100px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[100px] -ml-48 -mb-48"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Modal-style Card */}
                <div className="bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 p-5 sm:p-6">

                    {/* Header/Logo Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div
                            className="w-24 h-16 flex items-center justify-center mb-4"
                        >
                            <img src="/newlogo.png" alt="Our Home Tuition" className="w-full h-full object-contain scale-125" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#1B2A5A] tracking-tight">Admin Login</h2>
                        <p className="text-gray-400 text-sm mt-1">Access management portal</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 border border-red-100 text-red-500 p-3 rounded-xl mb-6 text-xs font-semibold text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1B2A5A] focus:ring-1 focus:ring-[#1B2A5A] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 text-sm"
                                    placeholder="name@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1B2A5A] focus:ring-1 focus:ring-[#1B2A5A] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 text-sm"
                                    placeholder="Password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-[#1B2A5A] text-white font-bold py-4 rounded-xl hover:bg-[#142044] transition-all disabled:opacity-50 shadow-lg shadow-[#1B2A5A]/10 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>Signing In... <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div></>
                            ) : (
                                <>Sign In <FaArrowRight size={14} /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                            <FaFingerprint size={12} className="opacity-50" />
                            Secure Admin Access
                        </div>
                    </div>
                </div>

                {/* Return Path Link */}
                <motion.button
                    onClick={() => navigate('/')}
                    whileHover={{ x: -4 }}
                    className="mt-8 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#1B2A5A] transition-colors uppercase tracking-widest mx-auto"
                >
                    <span className="text-lg">←</span> Return to home
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Login;
