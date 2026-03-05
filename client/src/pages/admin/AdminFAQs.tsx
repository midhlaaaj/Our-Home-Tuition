import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
    created_at: string;
}

const AdminFAQs: React.FC = () => {
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

    if (loading && faqs.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading FAQs...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage FAQs</h1>
                {!isEditing && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 bg-[#a0522d] text-white px-4 py-2 rounded-lg hover:bg-[#804224] transition-colors"
                    >
                        <FaPlus size={14} /> Add New FAQ
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{editingFaq.id ? 'Edit FAQ' : 'Add New FAQ'}</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <input
                                type="text"
                                value={editingFaq.question || ''}
                                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#a0522d] focus:border-[#a0522d]"
                                placeholder="Enter question..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                            <textarea
                                value={editingFaq.answer || ''}
                                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#a0522d] focus:border-[#a0522d] h-32"
                                placeholder="Enter detailed answer..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                            <input
                                type="number"
                                value={editingFaq.order || 0}
                                onChange={(e) => setEditingFaq({ ...editingFaq, order: parseInt(e.target.value) || 0 })}
                                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#a0522d] focus:border-[#a0522d]"
                            />
                        </div>
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setEditingFaq({}); }}
                                className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FaTimes /> Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-white bg-[#a0522d] hover:bg-[#804224] rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FaSave /> Save FAQ
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600 w-16">Order</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Question</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {faqs.map((faq) => (
                                <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{faq.order}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{faq.question}</div>
                                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">{faq.answer}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(faq)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="Edit"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(faq.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {faqs.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        No FAQs added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminFAQs;
