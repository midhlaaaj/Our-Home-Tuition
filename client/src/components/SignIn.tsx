import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../supabaseClient';

interface SignInProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'signin' | 'signup';
}

const SignIn: React.FC<SignInProps> = ({ isOpen, onClose, initialView = 'signin' }) => {
    const [isLogin, setIsLogin] = useState(initialView === 'signin');
    const [loading, setLoading] = useState(false);

    // Form States
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
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
            setIsLogin(initialView === 'signin');
            setErrors({});
            setLoginData({ email: '', password: '' });
            setRegisterData({ name: '', email: '', phone: '', address: '', password: '', verifyPassword: '' });
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

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
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
        if (!registerData.address) newErrors.address = 'Address is required';
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
            const { error } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
            });

            if (error) {
                setErrors({ auth: error.message });
            } else {
                onClose();
            }
        } catch (error) {
            setErrors({ auth: 'An unexpected error occurred.' });
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
                        address: registerData.address,
                    },
                },
            });

            if (error) {
                setErrors({ auth: error.message });
            } else if (data && !data.session) {
                // User created but session is null => Email confirmation required
                setErrors({
                    success: 'Registration successful! Please check your email to verify your account.'
                });
                // Optional: Clear form or close after a delay
                setTimeout(onClose, 5000);
            } else {
                onClose();
            }
        } catch (error) {
            setErrors({ auth: 'An unexpected error occurred.' });
            console.error('Register error:', error);
        } finally {
            setLoading(false);
        }
    };



    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Full Screen Overlay Container - Controls Positioning & Z-Index */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6">

                        {/* Backdrop with Blur & Dim Effect */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                            aria-hidden="true"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: 5 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 5 }}
                            transition={{ duration: 0.1, type: 'spring', damping: 25, stiffness: 400 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ring-1 ring-gray-900/5 flex flex-col my-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100/50"
                                >
                                    <FaTimes size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 sm:p-6 flex flex-col items-center">

                                {isLogin ? (
                                    <>
                                        {/* Logo Box */}
                                        <div className="w-14 h-14 bg-white border-2 border-[#ffb76c]/50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                            <span className="text-[#a0522d] text-2xl font-bold font-sans">HT</span>
                                        </div>

                                        {/* Social Logins */}
                                        <div className="w-full flex gap-3 mb-5">
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                <span className="text-sm font-medium text-gray-800">Sign In</span>
                                                <FcGoogle size={18} />
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                <span className="text-sm font-medium text-gray-800">Sign In</span>
                                                <FaFacebook size={18} className="text-[#1877F2]" />
                                            </button>
                                        </div>

                                        {/* OR Divider */}
                                        <div className="w-full flex items-center mb-5">
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                            <span className="px-4 text-sm text-gray-800 font-medium">OR</span>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mb-2 mt-2 w-full text-center"></div>
                                )}

                                {/* Global Error/Success Message */}
                                {(errors.auth || errors.success) && (
                                    <div className={`w-full mb-4 p-3 text-sm rounded-lg border text-center ${errors.success
                                        ? 'bg-green-50 text-green-600 border-green-100'
                                        : 'bg-red-50 text-red-500 border-red-100'
                                        }`}>
                                        {errors.auth || errors.success}
                                    </div>
                                )}

                                <AnimatePresence mode="wait" initial={false}>
                                    {isLogin ? (
                                        <motion.form
                                            key="login"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.15 }}
                                            onSubmit={handleLoginSubmit}
                                            className="w-full space-y-4"
                                        >
                                            <div>
                                                <input
                                                    id="login-email"
                                                    name="email"
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="Email"
                                                    value={loginData.email}
                                                    onChange={handleLoginChange}
                                                    className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#a0522d] focus:border-[#a0522d]'
                                                        } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`}
                                                />
                                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <input
                                                    id="login-password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    placeholder="Password"
                                                    value={loginData.password}
                                                    onChange={handleLoginChange}
                                                    className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#a0522d] focus:border-[#a0522d]'
                                                        } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`}
                                                />
                                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={!loginData.email || !loginData.password || loading}
                                                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#5d2366] hover:bg-[#4a1c51] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5d2366] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-sm"
                                                >
                                                    {loading ? 'Signing In...' : 'Sign In'}
                                                </button>
                                            </div>

                                            <div className="text-center pt-2 space-y-3">
                                                <div>
                                                    <a href="#" className="text-sm font-medium text-[#5d2366] hover:text-[#4a1c51]">Forgot Password?</a>
                                                </div>
                                                <div className="text-sm text-gray-900">
                                                    Not a member yet? <button type="button" onClick={() => { setIsLogin(false); setErrors({}); }} className="font-medium text-[#5d2366] hover:text-[#4a1c51]">Sign Up</button>
                                                </div>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="register"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.1 }}
                                            onSubmit={handleRegisterSubmit}
                                            className="w-full space-y-4"
                                            noValidate
                                        >
                                            {/* Logo Box */}
                                            <div className="w-14 h-14 bg-white border-2 border-[#ffb76c]/50 rounded-full flex items-center justify-center mb-6 shadow-sm mx-auto">
                                                <span className="text-[#a0522d] text-2xl font-bold font-sans">HT</span>
                                            </div>

                                            {/* Social Logins */}
                                            <div className="w-full flex gap-3 mb-5">
                                                <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <span className="text-sm font-medium text-gray-800">Sign Up</span>
                                                    <FcGoogle size={18} />
                                                </button>
                                                <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <span className="text-sm font-medium text-gray-800">Sign Up</span>
                                                    <FaFacebook size={18} className="text-[#1877F2]" />
                                                </button>
                                            </div>

                                            {/* OR Divider */}
                                            <div className="w-full flex items-center mb-5">
                                                <div className="flex-1 h-px bg-gray-200"></div>
                                                <span className="px-4 text-sm text-gray-800 font-medium">OR</span>
                                                <div className="flex-1 h-px bg-gray-200"></div>
                                            </div>

                                            <div>
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="Name"
                                                    value={registerData.name}
                                                    onChange={handleRegisterChange}
                                                    className={`appearance-none block w-full px-4 py-3 border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#a0522d] focus:border-[#a0522d]'
                                                        } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`}
                                                />
                                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                            </div>

                                            <div>
                                                <input
                                                    id="reg-email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="Email"
                                                    value={registerData.email}
                                                    onChange={handleRegisterChange}
                                                    className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#a0522d] focus:border-[#a0522d]'
                                                        } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`}
                                                />
                                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="Phone Number"
                                                    value={registerData.phone}
                                                    onChange={handleRegisterChange}
                                                    className={`appearance-none block w-full px-4 py-3 border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#a0522d] focus:border-[#a0522d]'
                                                        } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`}
                                                />
                                                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                            </div>

                                            <div>
                                                <input
                                                    id="reg-password"
                                                    name="password"
                                                    type="password"
                                                    placeholder="Password"
                                                    value={registerData.password}
                                                    onChange={handleRegisterChange}
                                                    className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#a0522d] focus:border-[#a0522d]'
                                                        } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition duration-200 text-sm`}
                                                />
                                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={loading || !(registerData.name && registerData.email && registerData.phone && registerData.password)}
                                                    className={`group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-sm ${registerData.name && registerData.email && registerData.phone && registerData.password
                                                        ? 'bg-[#a0522d] hover:bg-[#804224]'
                                                        : 'bg-[#cc8e71]'
                                                        }`}
                                                >
                                                    {loading ? 'Signing Up...' : 'Sign Up'}
                                                </button>
                                            </div>

                                            <div className="text-center pt-3 space-y-4">

                                                <div className="text-sm text-gray-900 font-medium">
                                                    Already have an account? <button type="button" onClick={() => { setIsLogin(true); setErrors({}); }} className="text-[#a0522d] hover:text-[#804224]">Sign In</button>
                                                </div>
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
