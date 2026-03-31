"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaEdit, FaPlus, FaStar, FaTimes, FaCheckCircle, FaTimesCircle, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BrandedLoading from '../../components/BrandedLoading';

interface Testimonial {
    id: string;
    name: string;
    role: string;
    rating: number;
    message: string;
    avatar_url: string;
    is_active: boolean;
}

interface MentorReview {
    id: string;
    created_at: string;
    booking_id: string;
    mentor_id: string;
    parent_id: string;
    rating: number;
    comment: string;
    is_public: boolean;
    mentors?: { name: string; subject: string; image_url: string };
    bookings?: { primary_student: any; curriculum: string };
}

const Reviews: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [view, setView] = useState<'testimonials' | 'mentor'>('mentor');
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [mentorReviews, setMentorReviews] = useState<MentorReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading] = useState(false); // Placeholder for upload state
    
    // Form state for Testimonials
    const [testForm, setTestForm] = useState<Partial<Testimonial>>({ role: 'Student', rating: 5, is_active: true });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        if (view === 'testimonials') fetchTestimonials();
        else fetchMentorReviews();
    }, [view]);

    const fetchTestimonials = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setTestimonials(data || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMentorReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mentor_reviews')
                .select('*, mentors(name, subject, image_url), bookings(primary_student, curriculum)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setMentorReviews(data || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('mentor_reviews').update({ is_public: !currentStatus }).eq('id', id);
            if (error) throw error;
            setMentorReviews(mentorReviews.map(r => r.id === id ? { ...r, is_public: !currentStatus } : r));
        } catch (err) {
            console.error('Error toggling visibility:', err);
        }
    };

    const handleToggleTestimonialVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('reviews').update({ is_active: !currentStatus }).eq('id', id);
            if (error) throw error;
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
        } catch (err) {
            console.error('Error toggling testimonial visibility:', err);
        }
    };

    const handleDeleteMentorReview = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            const { error } = await supabase.from('mentor_reviews').delete().eq('id', id);
            if (error) throw error;
            setMentorReviews(mentorReviews.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting review:', err);
        }
    };

    const handleTestimonialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...testForm };
            if (isEditing && editId) {
                const { error } = await supabase.from('reviews').update(data).eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('reviews').insert([data]);
                if (error) throw error;
            }
            setTestForm({ role: 'Student', rating: 5, is_active: true, name: '', message: '', avatar_url: '' });
            setIsEditing(false);
            setEditId(null);
            setShowAddForm(false);
            fetchTestimonials();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Urbanist']">
            <Link 
                href="/admin/operations" 
                className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#1B2A5A] transition-colors uppercase tracking-widest mb-2 group w-fit"
            >
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                Back to Operations
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reviews & Testimonials</h1>
                    <p className="text-sm font-bold text-[#1B2A5A] mt-1">Manage parent feedback and site testimonials</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex gap-2 bg-white p-1.5 rounded-[20px] border border-gray-100 shadow-sm self-start">
                        <button
                            onClick={() => {
                                setView('mentor');
                                setIsEditing(false);
                                setEditId(null);
                                setShowAddForm(false);
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'mentor' ? 'bg-[#1B2A5A] text-white shadow-xl shadow-[#1B2A5A]/20' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            <FaChalkboardTeacher size={12} /> Mentor Reviews
                        </button>
                        <button
                            onClick={() => {
                                setView('testimonials');
                                setIsEditing(false);
                                setEditId(null);
                                setShowAddForm(false);
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'testimonials' ? 'bg-[#a0522d] text-white shadow-xl shadow-[#a0522d]/20' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            <FaUserGraduate size={12} /> Site Testimonials
                        </button>
                    </div>

                    {view === 'testimonials' && (
                        <button
                            onClick={() => {
                                setShowAddForm(!showAddForm);
                                if (isEditing) {
                                    setIsEditing(false);
                                    setEditId(null);
                                    setTestForm({ role: 'Student', rating: 5, is_active: true });
                                }
                            }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${showAddForm ? 'bg-orange-50 text-[#a0522d] border-2 border-[#a0522d]/20' : 'bg-[#1B2A5A] text-white hover:bg-[#142044] shadow-[#1B2A5A]/20'}`}
                            title={showAddForm ? "Close Form" : "Add New Testimonial"}
                        >
                            {showAddForm ? <FaTimes size={18} /> : <FaPlus size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {view === 'testimonials' && showAddForm && (
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-50 mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                            <FaPlus size={16} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Register New Testimonial</h2>
                    </div>
                    <form onSubmit={handleTestimonialSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Person's Name</label>
                                <input 
                                    type="text" 
                                    value={testForm.name || ''} 
                                    onChange={e => setTestForm({...testForm, name: e.target.value})} 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" 
                                    placeholder="Enter your name" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role / Title</label>
                                <input 
                                    type="text" 
                                    value={testForm.role || ''} 
                                    onChange={e => setTestForm({...testForm, role: e.target.value})} 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" 
                                    placeholder="e.g. Parent of Grade 8 Student" 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Testimonial Message</label>
                                <textarea 
                                    value={testForm.message || ''} 
                                    onChange={e => setTestForm({...testForm, message: e.target.value})} 
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm min-h-[140px] resize-none" 
                                    placeholder="What was their experience?" 
                                    required 
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 bg-[#1B2A5A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20"
                                >
                                    Publish Testimonial
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {view === 'mentor' ? (
                loading ? (
                    <div className="p-20 text-center"><BrandedLoading className="mx-auto" /></div>
                ) : (
                    mentorReviews.length === 0 ? (
                        <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
                            <FaStar size={40} className="text-gray-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No mentor reviews yet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {mentorReviews.map(review => (
                                <motion.div layout key={review.id} className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden group hover:border-[#ffb76c]/30 transition-all duration-500">
                                    <div className="p-8">
                                        <div className="flex flex-col lg:flex-row gap-10">
                                            <div className="flex-1 space-y-8">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-[20px] bg-orange-50 flex items-center justify-center text-[#ffb76c]">
                                                            <FaUserGraduate size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[#a0522d] uppercase tracking-widest mb-1">Parent Feedback for {review.mentors?.name}</p>
                                                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">{review.bookings?.primary_student?.name}</h3>
                                                            <div className="flex items-center gap-1 mt-3">
                                                                {[...Array(5)].map((_, i) => <FaStar key={i} size={14} className={i < review.rating ? 'text-[#ffb76c]' : 'text-gray-100'} />)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Booking ID</span>
                                                        <p className="text-xs font-black text-gray-900">{review.booking_id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100/50 relative">
                                                    <span className="absolute -top-3 left-8 px-4 py-1 bg-white border border-gray-100 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm italic">"Review Message"</span>
                                                    <p className="text-gray-600 font-bold leading-relaxed italic">"{review.comment}"</p>
                                                </div>
                                            </div>

                                            <div className="lg:w-72">
                                                <div className="p-6 bg-gray-900 rounded-[32px] space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <img src={review.mentors?.image_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-[#ffb76c] uppercase tracking-widest leading-none mb-1">{review.mentors?.subject}</p>
                                                            <p className="text-xs font-black text-white">{review.mentors?.name}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="h-px bg-white/5"></div>
                                                    
                                                    <div className="space-y-3">
                                                        <button 
                                                            onClick={() => handleToggleVisibility(review.id, review.is_public)}
                                                            className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${review.is_public ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/10 hover:border-green-500/50 hover:text-green-500'}`}
                                                        >
                                                            {review.is_public ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {review.is_public ? 'Visible to Public' : 'Hidden from Public'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteMentorReview(review.id)}
                                                            className="w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            <FaTrash size={10} /> Delete Review
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                )
            ) : (
                <div className="space-y-8">
                    {loading ? (
                        <div className="p-20 text-center"><BrandedLoading className="mx-auto" /></div>
                    ) : (
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden text-sm animate-in fade-in duration-500">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-8 py-6">Contributor</th>
                                        <th className="px-6 py-6 font-mono">Rating</th>
                                        <th className="px-6 py-6">Visibility</th>
                                        <th className="px-6 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {testimonials.map(t => (
                                        <React.Fragment key={t.id}>
                                            <tr className={`group hover:bg-gray-50/50 transition-colors ${editId === t.id ? 'bg-orange-50/30' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${t.name}`} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" alt="" />
                                                        <div>
                                                            <p className="font-black text-gray-900">{t.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-1 text-[#ffb76c] font-black">
                                                        {Number(t.rating).toFixed(1)} <FaStar size={10} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${t.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                        {t.is_active ? 'Live' : 'Hidden'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {editId !== t.id && (
                                                            <>
                                                                <button onClick={() => { setTestForm(t); setIsEditing(true); setEditId(t.id); setShowAddForm(false); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm" title="Edit"><FaEdit size={14}/></button>
                                                                <button onClick={async () => { if(window.confirm('Delete?')) { await supabase.from('reviews').delete().eq('id', t.id); fetchTestimonials(); } }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm" title="Delete"><FaTrash size={14}/></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {editId === t.id && (
                                                <tr className="bg-orange-50/20 border-x-2 border-orange-100/50">
                                                    <td colSpan={4} className="px-8 py-8">
                                                        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                                            <form onSubmit={handleTestimonialSubmit} className="space-y-6">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div className="space-y-4">
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label>
                                                                            <input 
                                                                                type="text" 
                                                                                className="w-full bg-white border-2 border-gray-100 focus:border-[#a0522d] outline-none p-3 rounded-xl transition-all font-medium text-sm shadow-sm"
                                                                                value={testForm.name || ''} 
                                                                                onChange={e => setTestForm({...testForm, name: e.target.value})} 
                                                                                required 
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role / Title</label>
                                                                            <input 
                                                                                type="text" 
                                                                                className="w-full bg-white border-2 border-gray-100 focus:border-[#a0522d] outline-none p-3 rounded-xl transition-all font-medium text-sm shadow-sm"
                                                                                value={testForm.role || ''} 
                                                                                onChange={e => setTestForm({...testForm, role: e.target.value})} 
                                                                                required 
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Visibility</label>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setTestForm({ ...testForm, is_active: !testForm.is_active })}
                                                                                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${testForm.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                                                                            >
                                                                                {testForm.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                                                                                {testForm.is_active ? 'Live on Site' : 'Hidden from Site'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-6">
                                                                        <div className="space-y-1.5 flex-1">
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                                                                            <textarea 
                                                                                className="w-full h-full min-h-[120px] bg-white border-2 border-gray-100 focus:border-[#a0522d] outline-none p-3 rounded-xl transition-all font-medium text-sm shadow-sm resize-none"
                                                                                value={testForm.message || ''} 
                                                                                onChange={e => setTestForm({...testForm, message: e.target.value})} 
                                                                                required 
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { setIsEditing(false); setEditId(null); setTestForm({ role: 'Student', rating: 5, is_active: true }); }}
                                                                                className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all text-[10px] uppercase tracking-widest"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                type="submit"
                                                                                className="px-8 py-3 bg-[#a0522d] text-white rounded-xl font-black hover:bg-[#8b4513] transition-all shadow-md text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                                                            >
                                                                                Update Testimonial
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reviews;
