import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaUpload, FaStar } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Review {
    id: string;
    name: string;
    role: string;
    rating: number;
    message: string;
    avatar_url: string;
    is_active: boolean;
}

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<Partial<Review>>({ role: 'Student', rating: 5, is_active: true });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);



    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);

        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const publicUrl = await uploadFile(file, 'uploads', 'reviews');
            setForm(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload avatar. Make sure the "uploads" bucket exists and is public.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const reviewData = {
                name: form.name,
                role: form.role,
                rating: form.rating,
                message: form.message,
                avatar_url: form.avatar_url,
                is_active: form.is_active
            };

            if (isEditing && editId) {
                const { error } = await supabase
                    .from('reviews')
                    .update(reviewData)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('reviews')
                    .insert([reviewData]);
                if (error) throw error;
            }

            setForm({ role: 'Student', rating: 5, is_active: true, name: '', message: '', avatar_url: '' });
            setIsEditing(false);
            setEditId(null);
            fetchReviews();
        } catch (err) {
            console.error('Error saving review:', err);
            alert('Failed to save review. Make sure the database table exists.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            try {
                const { error } = await supabase
                    .from('reviews')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                fetchReviews();
            } catch (err) {
                console.error('Error deleting review:', err);
            }
        }
    };

    const handleEdit = (review: Review) => {
        setForm(review);
        setIsEditing(true);
        setEditId(review.id);
    };
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">Manage Reviews</h1>
                    <p className="text-sm text-gray-500 font-medium">Control home page testimonials.</p>
                </div>
                <button
                    onClick={() => {
                        const formElement = document.getElementById('review-form');
                        formElement?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-[#a0522d] text-white px-6 py-3 rounded-xl font-black hover:bg-[#804224] transition-all shadow-lg shadow-[#a0522d]/20 text-sm"
                >
                    Add New Review
                </button>
            </div>

            {/* Form */}
            <div id="review-form" className="bg-white p-6 md:p-8 rounded-[24px] shadow-xl border border-gray-50 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                        <FaEdit size={16} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        {isEditing ? 'Update Selection' : 'Register New Review'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Sarah Thompson"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.name || ''}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role / Subtitle</label>
                            <input
                                type="text"
                                placeholder="Student, Parent, etc."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.role || ''}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rating (Out of 5)</label>
                            <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border-2 border-transparent focus-within:border-[#a0522d] focus-within:bg-white transition-all">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setForm({ ...form, rating: star })}
                                            className="transition-transform active:scale-95 group"
                                        >
                                            <FaStar
                                                size={20}
                                                className={`transition-colors ${(form.rating || 0) >= star
                                                    ? 'text-orange-400'
                                                    : 'text-gray-200 group-hover:text-orange-200'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="ml-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                    {form.rating || 1} Star{(form.rating || 1) > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Avatar Image</label>
                            <div className="flex gap-3">
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Avatar URL (Optional)"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                        value={form.avatar_url || ''}
                                        onChange={e => setForm({ ...form, avatar_url: e.target.value })}
                                    />
                                    <label className="flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm shrink-0">
                                        <FaUpload size={14} className="text-gray-400" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                {form.avatar_url && (
                                    <div className="relative shrink-0">
                                        <img src={form.avatar_url} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-4 border-gray-50 shadow-md" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">The Review Message</label>
                        <textarea
                            placeholder="What did they say about us?"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-4 rounded-xl transition-all font-medium resize-none text-gray-700 leading-relaxed text-sm"
                            rows={3}
                            value={form.message || ''}
                            onChange={e => setForm({ ...form, message: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-2">
                        <label className="flex-grow flex items-center gap-3 bg-gray-50 p-4 rounded-xl border-2 border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.is_active ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                                {form.is_active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={form.is_active}
                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                            />
                            <div>
                                <p className="text-xs font-black text-gray-800">Publicly Visible</p>
                            </div>
                        </label>

                        <div className="flex gap-2">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setForm({ role: 'Student', rating: 5, is_active: true, name: '', message: '', avatar_url: '' }); }}
                                    className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-8 py-3.5 bg-[#1B2A5A] text-white rounded-xl font-black hover:bg-[#142044] disabled:opacity-50 transition-all shadow-xl shadow-[#1B2A5A]/10 text-sm flex items-center justify-center gap-2 shrink-0"
                            >
                                {isEditing ? 'Update Review' : 'Publish Review'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <FaStar size={16} className="text-orange-400" /> Published Reviews
                    </h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-gray-200/50">
                        {reviews.length} total
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center animate-pulse">
                        <div className="inline-block w-8 h-8 border-4 border-[#ffb76c]/20 border-t-[#ffb76c] rounded-full animate-spin"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaStar size={24} className="opacity-20" />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-1">No reviews found</h3>
                        <p className="text-sm font-medium">Add a new review to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Contributor</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Identity</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Sentiment</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-center">Visibility</th>
                                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reviews.map(review => (
                                    <tr key={review.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={review.avatar_url || `https://ui-avatars.com/api/?name=${review.name}`}
                                                        className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                                                        alt=""
                                                    />
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${review.is_active ? 'bg-green-500' : 'bg-red-400'}`}></div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 group-hover:text-[#a0522d] transition-colors text-sm">{review.name}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Review Entry</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black tracking-tight border border-blue-100 italic">
                                                {review.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-orange-400">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <FaStar key={i} size={10} />
                                                ))}
                                                <span className="ml-1 text-[10px] font-black text-gray-300">{review.rating}.0</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm ${review.is_active
                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                : 'bg-red-50 text-red-500 border-red-100'
                                                }`}>
                                                {review.is_active ? 'Live' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(review)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                    title="Edit Review"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    title="Delete Review"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Reviews;
