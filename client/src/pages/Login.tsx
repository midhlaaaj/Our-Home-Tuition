import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

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
                // Check role
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
            setError('An unexpected error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden font-['Urbanist']">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

            <div className="w-full max-w-md px-6 relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[40px] shadow-2xl border border-white/10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/20 group">
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Admin<span className="text-[#FF7F50]">Portal</span></h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Secure Management Access</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 text-xs font-bold flex items-center gap-3 animate-shake">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Email Identity</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#FF7F50]/50 focus:bg-white/10 outline-none transition-all font-medium text-white placeholder:text-white/10 text-sm"
                                placeholder="name@domain.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Secret Passphrase</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[#FF7F50]/50 focus:bg-white/10 outline-none transition-all font-medium text-white placeholder:text-white/10 text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#FF7F50] text-white font-black py-4 rounded-2xl hover:bg-[#FF6347] transition-all disabled:opacity-50 shadow-xl shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <>Authenticating... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></>
                            ) : 'Authorize Access'}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
                        Authorized Personnel Only <br />
                        © 2024 Our Home Tuition
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
