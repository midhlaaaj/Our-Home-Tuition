import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaStar, FaUserGraduate, FaChalkboardTeacher, FaCheckCircle, FaTimesCircle, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';

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
    const [view, setView] = useState<'testimonials' | 'mentor'>('mentor');
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [mentorReviews, setMentorReviews] = useState<MentorReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading] = useState(false); // Placeholder for upload state
    
    // Form state for Testimonials
    const [testForm, setTestForm] = useState<Partial<Testimonial>>({ role: 'Student', rating: 5, is_active: true });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

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
            fetchTestimonials();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    return (
        <div className="space-y-6 pt-4 animate-in fade-in duration-700">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reviews & Testimonials</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Manage parent feedback and site testimonials</p>
                </div>
                
                <div className="flex gap-2 bg-white p-1.5 rounded-[20px] border border-gray-100 shadow-sm self-start">
                    <button
                        onClick={() => setView('mentor')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'mentor' ? 'bg-[#1B2A5A] text-white shadow-xl shadow-[#1B2A5A]/20' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        <FaChalkboardTeacher size={12} /> Mentor Reviews
                    </button>
                    <button
                        onClick={() => setView('testimonials')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'testimonials' ? 'bg-[#a0522d] text-white shadow-xl shadow-[#a0522d]/20' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        <FaUserGraduate size={12} /> Site Testimonials
                    </button>
                </div>
            </div>

            {view === 'mentor' ? (
                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="p-20 text-center"><div className="w-12 h-12 border-4 border-[#ffb76c]/20 border-t-[#ffb76c] rounded-full animate-spin mx-auto"></div></div>
                    ) : mentorReviews.length === 0 ? (
                        <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
                            <FaStar size={40} className="text-gray-100 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No mentor reviews yet</p>
                        </div>
                    ) : (
                        mentorReviews.map(review => (
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
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Testimonials Form Source */}
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-50">
                        <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><FaEdit size={16} /></div>
                            {isEditing ? 'Update Testimonial' : 'Register New Testimonial'}
                        </h2>
                        <form onSubmit={handleTestimonialSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Person's Name</label>
                                    <input type="text" value={testForm.name || ''} onChange={e => setTestForm({...testForm, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-[#a0522d] rounded-2xl outline-none font-bold text-sm" placeholder="e.g. Sarah Thompson" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Role / Title</label>
                                    <input type="text" value={testForm.role || ''} onChange={e => setTestForm({...testForm, role: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-[#a0522d] rounded-2xl outline-none font-bold text-sm" placeholder="e.g. Parent of Grade 8 Student" required />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Testimonial Message</label>
                                    <textarea value={testForm.message || ''} onChange={e => setTestForm({...testForm, message: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-[#a0522d] rounded-2xl outline-none font-bold text-sm min-h-[140px] resize-none" placeholder="What was their experience?" required />
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" disabled={uploading} className="flex-1 py-4 bg-[#1B2A5A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20">
                                        {isEditing ? 'Update Records' : 'Publish Testimonial'}
                                    </button>
                                    {isEditing && <button type="button" onClick={() => { setIsEditing(false); setTestForm({}); }} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Testimonials List */}
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden text-sm">
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
                                    <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${t.name}`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                                <div>
                                                    <p className="font-black text-gray-900">{t.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-1 text-[#ffb76c]">
                                                {Number(t.rating).toFixed(1)} <FaStar size={10} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <button 
                                                onClick={() => handleToggleTestimonialVisibility(t.id, t.is_active)}
                                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${t.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}
                                            >
                                                {t.is_active ? 'Live' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setTestForm(t); setIsEditing(true); setEditId(t.id); }} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><FaEdit size={14}/></button>
                                                <button onClick={async () => { if(window.confirm('Delete?')) { await supabase.from('reviews').delete().eq('id', t.id); fetchTestimonials(); } }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><FaTrash size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;
