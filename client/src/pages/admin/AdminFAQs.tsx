import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
    created_at: string;
}

const AdminFAQs: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Partial<FAQ>>({});

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('faqs')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching FAQs:', error);
        } else {
            setFaqs(data || []);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingFaq.question || !editingFaq.answer) {
            alert("Please fill in both question and answer.");
            return;
        }

        const faqData = {
            question: editingFaq.question,
            answer: editingFaq.answer,
            order: editingFaq.order || 0
        };

        if (editingFaq.id) {
            // Update existing
            const { error } = await supabase
                .from('faqs')
                .update(faqData)
                .eq('id', editingFaq.id);

            if (error) console.error("Error updating FAQ:", error);
        } else {
            // Create new
            const { error } = await supabase
                .from('faqs')
                .insert([faqData]);

            if (error) console.error("Error adding FAQ:", error);
        }

        setIsEditing(false);
        setEditingFaq({});
        fetchFaqs();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting FAQ:", error);
        } else {
            fetchFaqs();
        }
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFaq(faq);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setEditingFaq({ order: faqs.length });
        setIsEditing(true);
    };


    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Urbanist']">
            <Link 
                to="/admin/homepage" 
                className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#1B2A5A] transition-colors uppercase tracking-widest mb-2 group w-fit"
            >
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                Back to Homepage Management
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Knowledge Base</h1>
                    <p className="text-sm font-bold text-[#1B2A5A] mt-1">Configure and index frequently asked questions</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={handleAddNew}
                        className="bg-[#a0522d] text-white px-5 py-2.5 rounded-xl font-black hover:bg-[#804224] transition-all flex items-center gap-2.5 shadow-xl shadow-[#a0522d]/10 group text-[11px] uppercase tracking-widest"
                    >
                        <div className="w-5 h-5 bg-white/10 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
                            <FaPlus size={10} />
                        </div>
                        Index New Entry
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="bg-white p-6 rounded-[28px] shadow-2xl border border-gray-50 mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                            {editingFaq.id ? <FaEdit size={14} /> : <FaPlus size={14} />}
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest">
                            {editingFaq.id ? 'Entry Calibration' : 'Entry Initialization'}
                        </h2>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Question Vector</label>
                            <input
                                type="text"
                                value={editingFaq.question || ''}
                                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-bold text-sm"
                                placeholder="Enter core query..."
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Resolution Content</label>
                            <textarea
                                value={editingFaq.answer || ''}
                                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-medium text-sm h-32 resize-none"
                                placeholder="Enter detailed resolution schema..."
                                required
                            />
                        </div>
                        <div className="space-y-1.5 w-1/3">
                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Display Sequence</label>
                            <input
                                type="number"
                                value={editingFaq.order || 0}
                                onChange={(e) => setEditingFaq({ ...editingFaq, order: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-bold text-sm"
                            />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setEditingFaq({}); }}
                                className="bg-gray-100 text-gray-500 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                            >
                                <FaTimes size={10} /> Abort
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-[#1B2A5A] text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#142044] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/10"
                            >
                                <FaSave size={10} /> Commit to Database
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    {loading && faqs.length === 0 ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-50 space-y-4 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded-lg w-3/4"></div>
                                <div className="h-10 bg-gray-50 rounded-lg w-full mt-2"></div>
                            </div>
                        ))
                    ) : faqs.length === 0 ? (
                        <div className="bg-white rounded-[32px] p-16 text-center border border-gray-50 shadow-2xl">
                            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaPlus size={24} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-1">Vault Empty</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">No knowledge matrices found.</p>
                        </div>
                    ) : (
                        faqs.map((faq) => (
                            <div key={faq.id} className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-50 group hover:border-orange-100/50 transition-all duration-300">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[9px] font-black text-gray-300 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                            ID: {faq.order}
                                        </span>
                                        <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight group-hover:text-[#a0522d] transition-colors">
                                            {faq.question}
                                        </h3>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(faq)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                            title="Recalibrate"
                                        >
                                            <FaEdit size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(faq.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                            title="Purge"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative pl-4 space-y-2">
                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-orange-100 rounded-full"></div>
                                    <p className="text-[11px] text-gray-500 leading-relaxed font-semibold italic">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminFAQs;
