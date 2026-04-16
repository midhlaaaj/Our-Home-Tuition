"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { useFormPersistence, STORAGE_KEY } from '../hooks/useFormPersistence';
import { getURL } from '../utils/urlUtils';

interface SignInProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'signin' | 'signup';
}

const SignIn: React.FC<SignInProps> = ({ isOpen, onClose, initialView = 'signin' }) => {
    const { supabaseClient: supabase } = useAuth();
    
    type AuthView = 'signin' | 'signup' | 'forgot-password' | 'magic-link';
    const [view, setView] = useState<AuthView>(initialView === 'signin' ? 'signin' : 'signup');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);

    // Form States - Login (No persistence for security)
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    
    // Registration Form with Persistence
    const { formData: registerData, updateField: updateRegisterField } = useFormPersistence({
        name: '',
        email: '',
        phone: '',
        password: '',
        verifyPassword: '',
    });

    // Error States
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset state synchronously when modal opens to prevent flicker
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setView(initialView === 'signin' ? 'signin' : 'signup');
            setErrors({});
            setLoginData({ email: '', password: '' });
            // Note: registerData is handled by persistence hook
            setShowPassword(false);
            setShowVerifyPassword(false);
        }
    }

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const validateLogin = () => {
        const newErrors: Record<string, string> = {};
        if (!loginData.email) newErrors.email = 'Email is required';
        if (!loginData.password) newErrors.password = 'Password is required';
        return newErrors;
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

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateLogin();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
            });

            if (error) {
                setErrors({ auth: error.message });
            } else if (data.user) {
                // Fetch profile to get details for persistence
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
                onClose();
            }
        } catch (error: any) {
            setErrors({ auth: error?.message || 'An unexpected error occurred.' });
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
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
            const { data, error } = await supabase.auth.signUp({
                email: registerData.email,
                password: registerData.password,
                options: {
                    data: {
                        full_name: registerData.name,
                        phone: registerData.phone,
                    },
                    redirectTo: getURL(),
                },
            });

            if (error) {
                setErrors({ auth: error.message });
            } else if (data && data.user) {
                // Insert into profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        name: registerData.name,
                        email: registerData.email,
                        phone: registerData.phone,
                        role: 'user'
                    }]);

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }

                // Seed persistence
                const toPersist = {
                    name: registerData.name,
                    fullName: registerData.name,
                    email: registerData.email,
                    phone: registerData.phone
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));

                if (!data.session) {
                    setErrors({
                        success: 'Registration successful! Please check your email to verify your account.'
                    });
                    setTimeout(onClose, 2000);
                } else {
                    onClose();
                }
            }
        } catch (error: any) {
            setErrors({ auth: error?.message || 'An unexpected error occurred.' });
            console.error('Register error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // ... OAuth handlers stay the same ...
    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: getURL() }
            });
            if (error) setErrors({ auth: error.message });
        } catch (error: any) {
            setErrors({ auth: error?.message || 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginData.email) {
            setErrors({ email: 'Email is required' });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, {
                redirectTo: `${getURL()}auth/reset-password`,
            });
            if (error) throw error;
            setErrors({ success: 'Password reset link sent! Please check your email.' });
        } catch (error: any) {
            setErrors({ auth: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginData.email) {
            setErrors({ email: 'Email is required' });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: loginData.email,
                options: {
                    emailRedirectTo: getURL(),
                },
            });
            if (error) throw error;
            setErrors({ success: 'Magic link sent! Please check your email to sign in.' });
        } catch (error: any) {
            setErrors({ auth: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: { redirectTo: getURL() }
            });
            if (error) setErrors({ auth: error.message });
        } catch (error: any) {
            setErrors({ auth: error?.message || 'An unexpected error occurred.' });
        } finally {
            setLoading(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                        />

                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: 5 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 5 }}
                            transition={{ duration: 0.1, type: 'spring', damping: 25, stiffness: 400 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ring-1 ring-gray-900/5 flex flex-col my-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100/50"
                                >
                                    <FaTimes size={18} />
                                </button>
                            </div>

                            <div className="p-5 sm:p-6 flex flex-col items-center">
                                {(view === 'signin' || view === 'magic-link') && (
                                    <>
                                        <div className="w-24 h-16 flex items-center justify-center mb-6">
                                            <img src="/brand-logo.png" alt="Hour Home" className="w-full h-full object-contain scale-150" />
                                        </div>
                                        <div className="w-full flex gap-3 mb-5">
                                            <button onClick={handleGoogleSignIn} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                                <span className="text-sm font-medium text-gray-800">Sign In</span>
                                                <FcGoogle size={18} />
                                            </button>
                                            <button onClick={handleFacebookSignIn} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                                <span className="text-sm font-medium text-gray-800">Sign In</span>
                                                <FaFacebook size={18} className="text-[#1877F2]" />
                                            </button>
                                        </div>
                                        <div className="w-full flex items-center mb-5">
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                            <span className="px-4 text-sm text-gray-800 font-medium">OR</span>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                        </div>
                                    </>
                                )}

                                {(errors.auth || errors.success) && (
                                    <div className={`w-full mb-4 p-3 text-sm rounded-lg border text-center ${errors.success ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                        {errors.auth || errors.success}
                                    </div>
                                )}

                                <AnimatePresence mode="wait" initial={false}>
                                    {view === 'signin' ? (
                                        <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }} onSubmit={handleLoginSubmit} className="w-full space-y-4">
                                            <div>
                                                <input id="login-email" name="email" type="email" autoComplete="email" placeholder="Email" value={loginData.email} onChange={handleLoginChange} className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                            </div>
                                            <div className="relative">
                                                <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={loginData.password} onChange={handleLoginChange} className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                </button>
                                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" disabled={!loginData.email || !loginData.password || loading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1B2A5A] hover:bg-[#142044] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B2A5A] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-sm">
                                                    {loading ? 'Signing In...' : 'Sign In'}
                                                </button>
                                            </div>
                                            <div className="text-center pt-2 space-y-3">
                                                <div className="flex flex-col gap-2">
                                                    <button type="button" onClick={() => setView('forgot-password')} className="text-sm font-medium text-[#1B2A5A] hover:text-[#142044]">Forgot Password?</button>
                                                    <button type="button" onClick={() => setView('magic-link')} className="text-sm font-medium text-[#1B2A5A] hover:text-[#142044]">Sign in with Magic Link</button>
                                                </div>
                                                <div className="text-sm text-gray-900 border-t border-gray-100 pt-3 mt-3">
                                                    Not a member yet? <button type="button" onClick={() => { setView('signup'); setErrors({}); }} className="font-medium text-[#1B2A5A] hover:text-[#142044]">Sign Up</button>
                                                </div>
                                            </div>
                                        </motion.form>
                                    ) : view === 'signup' ? (
                                        <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.1 }} onSubmit={handleRegisterSubmit} className="w-full space-y-4" noValidate>
                                            <div className="w-24 h-16 flex items-center justify-center mb-6 mx-auto">
                                                <img src="/brand-logo.png" alt="Hour Home" className="w-full h-full object-contain scale-150" />
                                            </div>
                                            <div className="w-full flex gap-3 mb-5">
                                                <button type="button" onClick={handleGoogleSignIn} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <span className="text-sm font-medium text-gray-800">Sign Up</span>
                                                    <FcGoogle size={18} />
                                                </button>
                                                <button type="button" onClick={handleFacebookSignIn} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <span className="text-sm font-medium text-gray-800">Sign Up</span>
                                                    <FaFacebook size={18} className="text-[#1877F2]" />
                                                </button>
                                            </div>
                                            <div className="w-full flex items-center mb-5">
                                                <div className="flex-1 h-px bg-gray-200"></div>
                                                <span className="px-4 text-sm text-gray-800 font-medium">OR</span>
                                                <div className="flex-1 h-px bg-gray-200"></div>
                                            </div>
                                            <div>
                                                <input id="name" name="name" type="text" placeholder="Name" value={registerData.name} onChange={(e) => updateRegisterField('name', e.target.value)} className={`appearance-none block w-full px-4 py-3 border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <input id="reg-email" name="email" type="email" placeholder="Email" value={registerData.email} onChange={(e) => updateRegisterField('email', e.target.value)} className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                            </div>
                                            <div className="relative group flex items-center bg-white rounded-lg border border-gray-200 focus-within:ring-[#1B2A5A] focus-within:ring-1 transition-all overflow-hidden h-[44px]">
                                                <div className="flex items-center pl-3 pr-2 text-gray-400 border-r border-gray-100 py-2 h-full">
                                                    <span className="font-black text-[10px]">+91</span>
                                                </div>
                                                <input id="phone" name="phone" type="tel" placeholder="Mobile Number" value={registerData.phone} onChange={(e) => updateRegisterField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full px-3 py-2 bg-transparent outline-none text-sm" />
                                            </div>
                                            <div className="relative">
                                                <input id="reg-password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={registerData.password} onChange={(e) => updateRegisterField('password', e.target.value)} className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                </button>
                                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                            </div>
                                            <div className="relative">
                                                <input id="verifyPassword" name="verifyPassword" type={showVerifyPassword ? "text" : "password"} placeholder="Verify Password" value={registerData.verifyPassword} onChange={(e) => updateRegisterField('verifyPassword', e.target.value)} className={`appearance-none block w-full px-4 py-3 border ${errors.verifyPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                <button type="button" onClick={() => setShowVerifyPassword(!showVerifyPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                                    {showVerifyPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                </button>
                                                {errors.verifyPassword && <p className="mt-1 text-xs text-red-500">{errors.verifyPassword}</p>}
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" disabled={loading || !(registerData.name && registerData.email && registerData.phone && registerData.password && registerData.verifyPassword)} className={`group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition duration-200 shadow-sm ${registerData.name && registerData.email && registerData.phone && registerData.password && registerData.verifyPassword ? 'bg-[#1B2A5A] hover:bg-[#142044]' : 'bg-[#1B2A5A]/60'}`}>
                                                    {loading ? 'Signing Up...' : 'Sign Up'}
                                                </button>
                                            </div>
                                            <div className="text-center pt-3 space-y-4">
                                                <div className="text-sm text-gray-900 font-medium whitespace-nowrap">Already have an account? <button type="button" onClick={() => { setView('signin'); setErrors({}); }} className="text-[#1B2A5A] hover:text-[#142044]">Sign In</button></div>
                                            </div>
                                        </motion.form>
                                    ) : view === 'forgot-password' ? (
                                        <motion.form key="forgot" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} onSubmit={handleForgotPasswordSubmit} className="w-full space-y-4">
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                                                <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a recovery link.</p>
                                            </div>
                                            <div>
                                                <input id="forgot-email" name="email" type="email" placeholder="Email" value={loginData.email} onChange={handleLoginChange} className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" disabled={!loginData.email || loading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1B2A5A] hover:bg-[#142044] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B2A5A] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-sm">
                                                    {loading ? 'Sending Link...' : 'Send Reset Link'}
                                                </button>
                                            </div>
                                            <div className="text-center pt-2">
                                                <button type="button" onClick={() => { setView('signin'); setErrors({}); }} className="text-sm font-medium text-[#1B2A5A] hover:text-[#142044]">Back to Login</button>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <motion.form key="magic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} onSubmit={handleMagicLinkSubmit} className="w-full space-y-4">
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg font-bold text-gray-900">Magic Link Login</h3>
                                                <p className="text-sm text-gray-500 mt-1">Sign in instantly without a password.</p>
                                            </div>
                                            <div>
                                                <input id="magic-email" name="email" type="email" placeholder="Email" value={loginData.email} onChange={handleLoginChange} className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#1B2A5A] focus:border-[#1B2A5A]'} rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`} />
                                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                            </div>
                                            <div className="pt-2">
                                                <button type="submit" disabled={!loginData.email || loading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1B2A5A] hover:bg-[#142044] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B2A5A] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-sm">
                                                    {loading ? 'Sending Link...' : 'Send Magic Link'}
                                                </button>
                                            </div>
                                            <div className="text-center pt-2">
                                                <button type="button" onClick={() => { setView('signin'); setErrors({}); }} className="text-sm font-medium text-[#1B2A5A] hover:text-[#142044]">Back to Login</button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SignIn;
