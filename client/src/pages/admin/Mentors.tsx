import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaUpload, FaPlus, FaUserCircle } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';
import { motion, AnimatePresence } from 'framer-motion';

interface Mentor {
    id: string; // Supabase uses id (uuid)
    name: string;
    subject: string;
    description: string;
    image_url: string; // specific naming convention for supabase
    is_active: boolean;
    email?: string;
    contact_no?: string;
    linkedin_url?: string;
    qualification?: string;
    work_history?: string;
    rating?: number;
    birth_year?: number;
    auth_user_id?: string;
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
        image_url: '',
        email: '',
        contact_no: '',
        linkedin_url: '',
        qualification: '',
        work_history: '',
        birth_year: undefined
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [accountLoading, setAccountLoading] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

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
                is_active: form.is_active,
                email: form.email,
                contact_no: form.contact_no,
                linkedin_url: form.linkedin_url,
                qualification: form.qualification,
                work_history: form.work_history,
                birth_year: form.birth_year ? parseInt(form.birth_year.toString()) : null
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

            setForm({ is_active: true, name: '', subject: '', description: '', image_url: '', email: '', contact_no: '', linkedin_url: '', qualification: '', work_history: '', birth_year: undefined });
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

    const handleCreateAccount = async (mentor: Mentor) => {
        if (!mentor.email || !mentor.birth_year) {
            alert('Email and Birth Year are required for account creation.');
            return;
        }

        const firstName = mentor.name.split(' ')[0].toLowerCase();
        const lastName = mentor.name.split(' ').slice(1).join('').toLowerCase();
        const password = `${firstName}${lastName}@${mentor.birth_year}`;

        if (!window.confirm(`Create account for ${mentor.email} with password: ${password}?`)) return;

        setAccountLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_mentor_account', {
                mentor_email: mentor.email,
                mentor_password: password,
                mentor_id: mentor.id
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            alert('Account created successfully!');
            fetchMentors();
        } catch (err: any) {
            console.error('Error creating account:', err);
            alert(`Failed to create account: ${err.message}`);
        } finally {
            setAccountLoading(false);
        }
    };

    const handleEdit = (mentor: Mentor) => {
        setForm({
            ...mentor,
            birth_year: mentor.birth_year || undefined
        });
        setIsEditing(true);
        setEditId(mentor.id);
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setForm({ is_active: true, name: '', subject: '', description: '', image_url: '', email: '', contact_no: '', linkedin_url: '', qualification: '', work_history: '', birth_year: undefined });
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-['Urbanist']">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Manage Mentors</h1>
                    <p className="text-sm text-gray-500 font-medium">Configure teacher profiles and system access.</p>
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
                    {isEditing && !form.auth_user_id && form.id && form.birth_year && (
                        <button
                            type="button"
                            onClick={() => handleCreateAccount(form as any)}
                            disabled={accountLoading}
                            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            <FaUserCircle size={14} />
                            {accountLoading ? 'Creating...' : 'Enable Portal Access'}
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mentor Name</label>
                            <input
                                type="text"
                                placeholder="FullName"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.name || ''}
                                onChange={e => {
                                    const name = e.target.value;
                                    const firstName = name.split(' ')[0].toLowerCase();
                                    const generatedEmail = name ? `${firstName} @ourhometuition.com` : '';
                                    setForm({ ...form, name, email: form.email || generatedEmail });
                                }}
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

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (System Access)</label>
                            <input
                                type="email"
                                placeholder="name@ourhometuition.com"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.email || ''}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                            <input
                                type="text"
                                placeholder="+91 ..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.contact_no || ''}
                                onChange={e => setForm({ ...form, contact_no: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">LinkedIn URL</label>
                            <input
                                type="url"
                                placeholder="https://linkedin.com/in/..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.linkedin_url || ''}
                                onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Birth Year (For Password)</label>
                            <input
                                type="number"
                                placeholder="1995"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.birth_year || ''}
                                onChange={e => setForm({ ...form, birth_year: parseInt(e.target.value) || undefined })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Educational Qualification</label>
                            <input
                                type="text"
                                placeholder="e.g. M.Sc in Mathematics, B.Ed"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.qualification || ''}
                                onChange={e => setForm({ ...form, qualification: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work History</label>
                            <textarea
                                placeholder="Previous experience, schools, etc..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-4 rounded-xl transition-all font-medium resize-none text-gray-700 text-sm h-20"
                                value={form.work_history || ''}
                                onChange={e => setForm({ ...form, work_history: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Bio</label>
                            <textarea
                                placeholder="Brief summary of experience..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-4 rounded-xl transition-all font-medium resize-none text-gray-700 text-sm h-24"
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
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
                                <div className={`w - 5 h - 5 rounded border - 2 flex items - center justify - center transition - all ${form.is_active ? 'bg-blue-600 border-blue-600' : 'border-gray-200'} `}>
                                    {form.is_active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                />
                                <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Public Profile</span>
                            </label>
                        </div>

                        <div className="flex gap-2 justify-end col-span-1 md:col-span-2 lg:col-span-1 lg:ml-auto">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all text-sm uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="px-8 py-3.5 bg-[#1B2A5A] text-white rounded-xl font-black hover:bg-[#142044] disabled:opacity-50 transition-all shadow-xl shadow-[#1B2A5A]/10 text-sm flex items-center justify-center gap-2 min-w-[140px] uppercase tracking-widest"
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
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Mentor Profile</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Expertise & Rating</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Contact info</th>
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
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 text-sm">{mentor.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{mentor.qualification || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="bg-orange-50 text-[#a0522d] px-2 py-1 rounded text-[10px] font-black tracking-tight border border-orange-100 self-start">
                                                    {mentor.subject}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-black text-yellow-500">★</span>
                                                    <span className="text-[10px] font-black text-gray-600">{mentor.rating || '0.0'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-gray-700">{mentor.email}</span>
                                                <span className="text-[10px] font-medium text-gray-400">{mentor.contact_no}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm ${mentor.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                    {mentor.is_active ? 'Live' : 'Hidden'}
                                                </span>
                                                {mentor.auth_user_id ? (
                                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Portal Enabled</span>
                                                ) : (
                                                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">No Access</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {!mentor.auth_user_id && mentor.birth_year && (
                                                    <button
                                                        onClick={() => handleCreateAccount(mentor)}
                                                        disabled={accountLoading}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10"
                                                        title="Create Login Portal"
                                                    >
                                                        {accountLoading ? '...' : 'Enable Portal'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setSelectedMentor(mentor); setIsDetailOpen(true); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-all shadow-sm"
                                                    title="View Full Profile"
                                                >
                                                    <FaPlus size={14} />
                                                </button>
                                                <button onClick={() => handleEdit(mentor)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm" title="Edit Profile"><FaEdit size={14} /></button>
                                                <button onClick={() => handleDelete(mentor.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm" title="Delete Profile"><FaTrash size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {isDetailOpen && selectedMentor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDetailOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="h-32 bg-gradient-to-r from-[#1B2A5A] to-[#2A4185]" />
                            <div className="px-8 pb-10">
                                <div className="relative -mt-16 mb-6 flex justify-between items-end">
                                    <img
                                        src={selectedMentor.image_url}
                                        alt={selectedMentor.name}
                                        className="w-32 h-32 rounded-3xl border-8 border-white object-cover shadow-xl"
                                    />
                                    <button
                                        onClick={() => setIsDetailOpen(false)}
                                        className="mb-4 px-6 py-2 bg-gray-100 text-gray-400 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedMentor.name}</h2>
                                            <span className="bg-orange-50 text-[#a0522d] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                                {selectedMentor.subject}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs">{selectedMentor.qualification}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-sm font-bold text-gray-800">{selectedMentor.email || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Number</p>
                                            <p className="text-sm font-bold text-gray-800">{selectedMentor.contact_no || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LinkedIn Profile</p>
                                            <a href={selectedMentor.linkedin_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline">View Profile</a>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</p>
                                            <span className="text-[10px] font-black uppercase text-green-500">{selectedMentor.auth_user_id ? 'Active Portal' : 'No Access'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#a0522d]">Professional Summary</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{selectedMentor.description}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#a0522d]">Work History</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">{selectedMentor.work_history || 'No work history provided.'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Mentors;
