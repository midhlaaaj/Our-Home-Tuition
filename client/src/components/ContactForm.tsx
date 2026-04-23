"use client";

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaPaperPlane, FaCheck } from 'react-icons/fa';
import { useFormPersistence } from '../hooks/useFormPersistence';

const ContactForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { formData, updateField, clearPersistence } = useFormPersistence({
        name: '',
        email: '',
        phone: '',
        query: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.phone.length !== 10) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('contact_queries')
                .insert([{
                    name: formData.name,
                    email: formData.email,
                    phone: `+91 ${formData.phone}`,
                    query: formData.query
                }]);

            if (error) throw error;

            // Update lead record
            const fingerprint = typeof window !== 'undefined' ? localStorage.getItem('site_lead_fingerprint') : null;
            if (fingerprint) {
                await supabase
                    .from('site_leads')
                    .update({ 
                        has_queried: true,
                        name: formData.name,
                        email: formData.email,
                        phone: `+91 ${formData.phone}`
                    })
                    .eq('fingerprint', fingerprint);
            }
            setSubmitted(true);
            clearPersistence(); // Clear persistence after successful submission
            // We don't manually clear formData here because persistence hook handles state, 
            // but for a smooth UX we can just reset if we want. 
            // Actually, clearPersistence and a local reset is good.
            updateField('query', ''); 
            setTimeout(() => setSubmitted(false), 5000);

        } catch (err: any) {
            console.error('Submission error:', err);
            alert(`Failed to send message: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-12 bg-[#F9FAFB] overflow-hidden relative min-h-[85vh] flex items-center">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#1B2A5A]/5 transform skew-x-12 translate-x-32 hidden lg:block"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="text-center mb-8 space-y-2">
                    <p className="text-[10px] font-black text-[#a0522d] uppercase tracking-[0.4em] font-['Urbanist']">Classes 1-10 Excellence</p>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight font-['Urbanist']">
                        Future-Ready <span className="text-[#a0522d]">Tuitions.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left side: Premium Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 relative h-full min-h-[600px] flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#a0522d]/10 text-[#a0522d] rounded-full text-[9px] font-black uppercase tracking-widest mb-6 self-start border border-[#a0522d]/20">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a0522d] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#a0522d]"></span>
                                </span>
                                Direct Enrollment
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Still doubtful? Raise a query or request a callback</h3>
                            <p className="text-gray-500 font-medium mb-8 text-sm">Join the top-rated tuition center for primary & high school students</p>

                            {submitted ? (
                                <div className="flex-1 flex flex-col justify-center py-16 text-center animate-in fade-in zoom-in duration-500 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                                        <FaCheck size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">Registration Logged!</h3>
                                    <p className="text-gray-500 font-medium text-sm leading-relaxed px-8">
                                        Our academic counselors will call you <br /> within the next 24 hours.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1">Student Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => updateField('name', e.target.value)}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-[#a0522d]/30 focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 text-sm"
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Guardian Contact</label>
                                            <div className="relative group flex items-center bg-gray-50 rounded-2xl border border-transparent focus-within:border-[#a0522d]/30 focus-within:bg-white transition-all overflow-hidden font-medium">
                                                <div className="flex items-center pl-5 pr-3 text-gray-500 group-focus-within:text-[#a0522d] border-r border-gray-200 py-4">
                                                    <span className="font-black text-sm">+91</span>
                                                </div>
                                                <input
                                                    required
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        updateField('phone', val);
                                                    }}
                                                    className="w-full px-4 py-4 bg-transparent outline-none text-gray-900 placeholder:text-gray-500 text-sm"
                                                    placeholder="10 digit mobile"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={e => updateField('email', e.target.value)}
                                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-[#a0522d]/30 focus:bg-white outline-none transition-all font-medium text-gray-900 placeholder:text-gray-500 text-sm"
                                                placeholder="name@email.com"
                                            />
                                        </div>
                                    </div>



                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1">Grade & Requirements</label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={formData.query}
                                            onChange={e => updateField('query', e.target.value)}
                                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-[#a0522d]/30 focus:bg-white outline-none transition-all font-medium resize-none text-gray-900 placeholder:text-gray-500 text-sm leading-relaxed"
                                            placeholder="Mention class and subjects needed..."
                                        />
                                    </div>

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full bg-[#FF7F50] text-white py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-base md:text-xl hover:bg-[#FF6347] disabled:opacity-50 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 group mt-2 transform active:scale-95"
                                    >
                                        {loading ? (
                                            <>Processing... <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></>
                                        ) : (
                                            <>Request Callback <FaPaperPlane className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-sm" /></>
                                        )}
                                    </button>

                                    <div className="flex flex-wrap items-center justify-center gap-6 pt-6 opacity-60">
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                            <FaCheck size={8} className="text-[#a0522d]" /> Certified Tutors
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                            <FaCheck size={8} className="text-[#a0522d]" /> Individual Focus
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                            <FaCheck size={8} className="text-[#a0522d]" /> Results Guaranteed
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right side: Branding Content */}
                    <div className="lg:col-span-5 h-full min-h-[400px]">
                        <div className="relative h-full rounded-[40px] overflow-hidden group shadow-2xl shadow-blue-900/10 border-4 border-white">
                            <img
                                src="/images/tuition-contact.png"
                                alt="Class 1-10 Students Learning"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A5A]/80 via-transparent to-transparent"></div>

                            <div className="absolute bottom-0 left-0 p-10 space-y-4">
                                <div className="w-12 h-1.5 bg-orange-400 rounded-full"></div>
                                <h3 className="text-3xl font-black text-white leading-none tracking-tight">
                                    Empowering <br />
                                    <span className="text-[#ffb76c]">Junior Scholars</span> <br />
                                    to excel.
                                </h3>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Trusted by 500+ Parents</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactForm;
