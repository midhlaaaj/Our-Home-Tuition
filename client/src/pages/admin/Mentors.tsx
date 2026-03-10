import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaUpload } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Mentor {
    id: string; // Supabase uses id (uuid)
    name: string;
    subject: string;
    description: string;
    image_url: string; // specific naming convention for supabase
    is_active: boolean;
}

const Mentors: React.FC = () => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<Partial<Mentor>>({
        is_active: true,
        name: '',
        subject: '',
        description: '',
        image_url: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMentors(data || []);
        } catch (err) {
            console.error('Error fetching mentors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            // Upload to 'mentors' bucket
            const publicUrl = await uploadFile(file, 'mentors', 'mentors');
            setForm(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Make sure the "mentors" bucket exists and is public.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const mentorData = {
                name: form.name,
                subject: form.subject,
                description: form.description,
                image_url: form.image_url,
                is_active: form.is_active
            };

            if (isEditing && editId) {
                const { error } = await supabase
                    .from('mentors')
                    .update(mentorData)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('mentors')
                    .insert([mentorData]);
                if (error) throw error;
            }

            setForm({ is_active: true, name: '', subject: '', description: '', image_url: '' });
            setIsEditing(false);
            setEditId(null);
            fetchMentors();
        } catch (err) {
            console.error('Error saving mentor:', err);
            alert('Failed to save mentor. Ensure "mentors" table exists in Supabase.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;

        try {
            const { error } = await supabase
                .from('mentors')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchMentors();
        } catch (err) {
            console.error('Error deleting mentor:', err);
        }
    };

    const handleEdit = (mentor: Mentor) => {
        setForm(mentor);
        setIsEditing(true);
        setEditId(mentor.id);
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Manage Mentors</h1>
                    <p className="text-sm text-gray-500 font-medium">Configure teacher profiles for students.</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-50 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                        <FaEdit size={16} />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                        {isEditing ? 'Edit Mentor Profile' : 'Register New Mentor'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mentor Name</label>
                            <input
                                type="text"
                                placeholder="FullName"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.name || ''}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Expertise</label>
                            <input
                                type="text"
                                placeholder="e.g. Mathematics"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.subject || ''}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Bio</label>
                            <textarea
                                placeholder="Brief summary of experience..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-4 rounded-xl transition-all font-medium resize-none text-gray-700 text-sm h-24"
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profile Image</label>
                            <div className="flex gap-3">
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Image URL"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                        value={form.image_url || ''}
                                        onChange={e => setForm({ ...form, image_url: e.target.value })}
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
                                {form.image_url && (
                                    <div className="relative shrink-0">
                                        <img src={form.image_url} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-4 border-gray-50 shadow-md" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border-2 border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.is_active ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                                    {form.is_active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                />
                                <span className="text-xs font-black text-gray-800">Public Profile</span>
                            </label>
                        </div>

                        <div className="flex gap-2 justify-end col-span-2 md:col-span-1 ml-auto">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setForm({ is_active: true, name: '', subject: '', description: '', image_url: '' }); }}
                                    className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="px-8 py-3.5 bg-[#1B2A5A] text-white rounded-xl font-black hover:bg-[#142044] disabled:opacity-50 transition-all shadow-xl shadow-[#1B2A5A]/10 text-sm flex items-center justify-center gap-2 min-w-[140px]"
                            >
                                {loading ? 'Saving...' : (isEditing ? 'Update Mentor' : 'Add Mentor')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Active Faculty</h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-gray-200/50">
                        {mentors.length} Profiles
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Profile</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Expertise</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 w-1/3">Bio</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {mentors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 text-sm font-medium italic">No mentor profiles registered yet.</td>
                                </tr>
                            ) : (
                                mentors.map((mentor) => (
                                    <tr key={mentor.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={mentor.image_url} alt={mentor.name} className="h-10 w-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                                                <span className="font-black text-gray-900 text-sm">{mentor.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-orange-50 text-[#a0522d] px-2 py-1 rounded text-[10px] font-black tracking-tight border border-orange-100">
                                                {mentor.subject}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[11px] text-gray-500 leading-relaxed max-w-xs">{mentor.description}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm ${mentor.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                {mentor.is_active ? 'Live' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => handleEdit(mentor)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all" title="Edit Profile"><FaEdit size={14} /></button>
                                                <button onClick={() => handleDelete(mentor.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete Profile"><FaTrash size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Mentors;
