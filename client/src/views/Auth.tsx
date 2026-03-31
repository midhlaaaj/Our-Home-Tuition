"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useFormPersistence, STORAGE_KEY } from '../hooks/useFormPersistence';

const Auth: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Register form with persistence
    const { formData: registerData, updateField: updateRegisterField } = useFormPersistence({
        name: '',
        email: '',
        phone: '',
        password: '',
        verifyPassword: '',
    });

    // Login form (no persistence for security reasons, usually)
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    });
    
    const [showLoginPass, setShowLoginPass] = useState(false);
    const [showRegPass, setShowRegPass] = useState(false);
    const [showVerifyPass, setShowVerifyPass] = useState(false);
    
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const validateRegister = () => {
        const newErrors: Record<string, string> = {};
        if (!registerData.name) newErrors.name = 'Name is required';
        if (!registerData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!registerData.phone) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d+$/.test(registerData.phone)) {
            newErrors.phone = 'Phone number must be numeric';
        }
        if (!registerData.password) newErrors.password = 'Password is required';
        if (!registerData.verifyPassword) newErrors.verifyPassword = 'Please verify your password';

        if (registerData.password && registerData.verifyPassword && registerData.password !== registerData.verifyPassword) {
            newErrors.verifyPassword = 'Passwords do not match';
        }
        return newErrors;
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateRegister();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: registerData.email,
                password: registerData.password,
                options: {
                    data: {
                        full_name: registerData.name,
                        phone: registerData.phone,
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: authData.user.id,
                        name: registerData.name,
                        email: registerData.email,
                        phone: registerData.phone,
                        role: 'user'
                    }]);

                if (profileError) console.error('Profile creation error:', profileError);

                // Seed persistence
                const toPersist = {
                    name: registerData.name,
                    fullName: registerData.name,
                    email: registerData.email,
                    phone: registerData.phone
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
            }

            setErrors({ success: 'Registration successful! Please check your email to verify your account.' });
        } catch (error: any) {
            setErrors({ auth: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
            });
            if (error) throw error;

            if (data.user) {
                // Fetch profile to seed persistence
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile) {
                    const toPersist = {
                        name: profile.name,
                        fullName: profile.name,
                        email: profile.email,
                        phone: profile.phone,
                        address: profile.address
                    };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
                }
            }
        } catch (error: any) {
            setErrors({ auth: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${isLogin ? 'text-[#1B2A5A] bg-white border-b-2 border-[#1B2A5A]' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${!isLogin ? 'text-[#1B2A5A] bg-white border-b-2 border-[#1B2A5A]' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-48 h-24 mb-4">
                            <img src="/newlogo.png" alt="Hour Home" className="w-full h-full object-contain scale-125" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-sm font-bold text-[#1B2A5A] mt-1 uppercase tracking-widest text-[10px]">
                            {isLogin ? 'Sign in to access your dashboard' : 'Join our learning community'}
                        </p>
                    </div>

                    {(errors.auth || errors.success) && (
                        <div className={`mb-6 p-4 rounded-xl border text-sm font-bold text-center ${errors.success ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                            {errors.auth || errors.success}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {isLogin ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleLoginSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
                                            <FaEnvelope size={14} />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@email.com"
                                            value={loginData.email}
                                            onChange={handleLoginChange}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
                                            <FaLock size={14} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showLoginPass ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={loginData.password}
                                            onChange={handleLoginChange}
                                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPass(!showLoginPass)}
                                            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showLoginPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !loginData.email || !loginData.password}
                                    className="w-full bg-[#1B2A5A] text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#142044] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl shadow-blue-900/10"
                                >
                                    {loading ? 'Processing...' : 'Sign In'}
                                    <FaArrowRight size={14} />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="register"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleRegisterSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label htmlFor="name" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
                                            <FaUser size={14} />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="Your Name"
                                            value={registerData.name}
                                            onChange={(e) => updateRegisterField('name', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="reg-email" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Email</label>
                                        <input
                                            id="reg-email"
                                            name="email"
                                            type="email"
                                            placeholder="name@email.com"
                                            value={registerData.email}
                                            onChange={(e) => updateRegisterField('email', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Phone</label>
                                        <div className="relative group flex items-center bg-gray-50 rounded-xl border border-gray-100 focus-within:border-[#1B2A5A] focus-within:bg-white transition-all overflow-hidden h-[46px]">
                                            <div className="flex items-center pl-4 pr-2 text-gray-400 border-r border-gray-100 py-3 h-full">
                                                <span className="font-black text-xs">+91</span>
                                            </div>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="Mobile Number"
                                                value={registerData.phone}
                                                onChange={(e) => updateRegisterField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="w-full px-3 py-3 bg-transparent outline-none text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label htmlFor="reg-password" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Password</label>
                                        <div className="relative">
                                            <input
                                                id="reg-password"
                                                name="password"
                                                type={showRegPass ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={registerData.password}
                                                onChange={(e) => updateRegisterField('password', e.target.value)}
                                                className="w-full px-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegPass(!showRegPass)}
                                                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showRegPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="verifyPassword" className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Verify</label>
                                        <div className="relative">
                                            <input
                                                id="verifyPassword"
                                                name="verifyPassword"
                                                type={showVerifyPass ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={registerData.verifyPassword}
                                                onChange={(e) => updateRegisterField('verifyPassword', e.target.value)}
                                                className="w-full px-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1B2A5A] focus:bg-white transition-all font-bold text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowVerifyPass(!showVerifyPass)}
                                                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showVerifyPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !(registerData.name && registerData.email && registerData.phone && registerData.password)}
                                    className="w-full bg-[#1B2A5A] text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#142044] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl shadow-blue-900/10"
                                >
                                    {loading ? 'Processing...' : 'Create Account'}
                                    <FaArrowRight size={14} />
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Auth;
