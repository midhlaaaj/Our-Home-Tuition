import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);

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

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        // Clear error when user types
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

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateLogin();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        console.log('Login Data:', loginData);
        // TODO: Integrate backend login
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateRegister();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        console.log('Register Data:', registerData);
        // TODO: Integrate backend registration
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
            >
                {/* Toggle Switch */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-8 relative">
                    <motion.div
                        className="absolute top-1 bottom-1 w-1/2 bg-white rounded-lg shadow-sm"
                        initial={false}
                        animate={{
                            x: isLogin ? 0 : '100%',
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                    <button
                        onClick={() => { setIsLogin(true); setErrors({}); }}
                        className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${isLogin ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setErrors({}); }}
                        className={`flex-1 relative z-10 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${!isLogin ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Register
                    </button>
                </div>

                <div className="mt-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-500 text-center mb-6 text-sm">
                        {isLogin ? 'Please sign in to continue' : 'Fill in your details to get started'}
                    </p>

                    <AnimatePresence mode="wait">
                        {isLogin ? (
                            <motion.form
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleLoginSubmit}
                                className="space-y-5"
                            >
                                <div>
                                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Enter your email"
                                        value={loginData.email}
                                        onChange={handleLoginChange}
                                        className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                            } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                </div>

                                <div>
                                    <label htmlFor="login-password"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={loginData.password}
                                        onChange={handleLoginChange}
                                        className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                            } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                    />
                                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={!loginData.email || !loginData.password}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Sign In
                                    </button>
                                </div>
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
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={registerData.name}
                                        onChange={handleRegisterChange}
                                        className={`appearance-none block w-full px-4 py-3 border ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                            } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            id="reg-email"
                                            name="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={registerData.email}
                                            onChange={handleRegisterChange}
                                            className={`appearance-none block w-full px-4 py-3 border ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                                } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="Enter phone number"
                                            value={registerData.phone}
                                            onChange={handleRegisterChange}
                                            className={`appearance-none block w-full px-4 py-3 border ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                                } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                        />
                                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        placeholder="Enter your address"
                                        value={registerData.address}
                                        onChange={handleRegisterChange}
                                        className={`appearance-none block w-full px-4 py-3 border ${errors.address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                            } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                    />
                                    {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            id="reg-password"
                                            name="password"
                                            type="password"
                                            placeholder="Create password"
                                            value={registerData.password}
                                            onChange={handleRegisterChange}
                                            className={`appearance-none block w-full px-4 py-3 border ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                                } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                        />
                                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="verify-password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Verify Password
                                        </label>
                                        <input
                                            id="verify-password"
                                            name="verifyPassword"
                                            type="password"
                                            placeholder="Confirm password"
                                            value={registerData.verifyPassword}
                                            onChange={handleRegisterChange}
                                            className={`appearance-none block w-full px-4 py-3 border ${errors.verifyPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                                } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition duration-200`}
                                        />
                                        {errors.verifyPassword && <p className="mt-1 text-xs text-red-500">{errors.verifyPassword}</p>}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md hover:shadow-lg"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
