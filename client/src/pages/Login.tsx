import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaEnvelope, FaFingerprint, FaArrowRight } from 'react-icons/fa';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

                if (profile?.role === 'admin') {
                    navigate('/admin');
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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#1B2A5A] relative overflow-hidden font-['Urbanist']">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#ffb76c]/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[480px] px-6 relative z-10"
            >
                {/* Premium Glassmorphic Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl p-10 md:p-14 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                    {/* Subtle Top Light Effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="text-center mb-12">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 backdrop-blur-md shadow-2xl shadow-black/40"
                        >
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain filter drop-shadow-lg" />
                        </motion.div>
                        <h2 className="text-4xl font-black text-white tracking-tighter mb-3">
                            Admin<span className="text-[#ffb76c]">Hub</span>
                        </h2>
                        <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.4em]">Autonomous Management Engine</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-4"
                            >
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Digital Identity</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within/input:text-[#ffb76c] transition-colors">
                                    <FaEnvelope size={14} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-[22px] bg-white/[0.03] border border-white/10 focus:border-[#ffb76c]/40 focus:bg-white/[0.07] outline-none transition-all font-bold text-white placeholder:text-white/10 text-sm"
                                    placeholder="Enter system email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Access Token</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within/input:text-[#ffb76c] transition-colors">
                                    <FaLock size={14} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-[22px] bg-white/[0.03] border border-white/10 focus:border-[#ffb76c]/40 focus:bg-white/[0.07] outline-none transition-all font-bold text-white placeholder:text-white/10 text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-[#ffb76c] text-[#1F2937] font-black py-5 rounded-2xl hover:bg-[#ffc685] transition-all disabled:opacity-50 shadow-[0_12px_24px_-8px_rgba(255,183,108,0.4)] flex items-center justify-center gap-3 mt-10 text-sm uppercase tracking-[0.1em]"
                        >
                            {loading ? (
                                <>Validating Credentials <div className="w-5 h-5 border-[3px] border-[#1F2937]/20 border-t-[#1F2937] rounded-full animate-spin"></div></>
                            ) : (
                                <>Establish Connection <FaArrowRight size={14} /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-12 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                            <FaFingerprint size={12} className="opacity-40" />
                            Biometric Integrity Verified
                        </div>
                        <p className="text-[9px] font-black text-white/10 uppercase tracking-widest text-center leading-relaxed">
                            Secured and End-to-End Encrypted <br />
                            © 2024 Our Home Tuition Environment v2.0
                        </p>
                    </div>
                </div>

                {/* Return Path Link */}
                <motion.button
                    onClick={() => navigate('/')}
                    whileHover={{ x: -4 }}
                    className="mt-8 flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-white/60 transition-colors uppercase tracking-widest mx-auto"
                >
                    <span className="text-sm">←</span> Return to Public Website
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Login;

