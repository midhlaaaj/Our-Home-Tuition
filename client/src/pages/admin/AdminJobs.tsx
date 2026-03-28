import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { classesData } from '../../constants/classesData';
import { FaPlus, FaTrash, FaBriefcase, FaCheck, FaTimes } from 'react-icons/fa';

interface Subject {
    id: string;
    name: string;
    class_id: number;
}

interface Job {
    id: string;
    title: string;
    description: string;
    class_id: number;
    subject_id: string | null;
    is_active: boolean;
    created_at: string;
}

const AdminJobs: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<number>(1);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
    const [isAdding, setIsAdding] = useState(false);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setJobs(data || []);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async (classId: number) => {
        try {
            const { data, error } = await supabase
                .from('class_subjects')
                .select('id, name, class_id')
                .eq('class_id', classId);
            if (error) throw error;
            setSubjects(data || []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        fetchSubjects(selectedClassId);
        setSelectedSubjectId('all');
    }, [selectedClassId]);

    const handleAddJob = async () => {
        if (!title.trim()) return;
        try {
            const { error } = await supabase
                .from('jobs')
                .insert([{
                    title: title.trim(),
                    description: description.trim(),
                    class_id: selectedClassId,
                    subject_id: selectedSubjectId === 'all' ? null : selectedSubjectId,
                    is_active: true
                }]);

            if (error) throw error;
            setTitle('');
            setDescription('');
            setIsAdding(false);
            fetchJobs();
        } catch (err) {
            console.error('Error adding job:', err);
            alert('Failed to add job.');
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm('Are you sure you want to delete this job posting?')) return;
        try {
            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchJobs();
        } catch (err) {
            console.error('Error deleting job:', err);
            alert('Failed to delete job.');
        }
    };

    const toggleJobStatus = async (job: Job) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ is_active: !job.is_active })
                .eq('id', job.id);
            if (error) throw error;
            fetchJobs();
        } catch (err) {
            console.error('Error updating job status:', err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recruitment Portal</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Orchestrate career opportunities and talent acquisition</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-[#a0522d] text-white px-5 py-2.5 rounded-xl font-black hover:bg-[#804224] transition-all flex items-center gap-2.5 shadow-xl shadow-[#a0522d]/10 group text-[11px] uppercase tracking-widest"
                >
                    <div className="w-5 h-5 bg-white/10 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
                        {isAdding ? <FaTimes size={10} /> : <FaPlus size={10} />}
                    </div>
                    {isAdding ? 'Close Protocol' : 'Deploy Posting'}
                </button>
            </div>

            {/* Add Job Form */}
            {isAdding && (
                <div className="bg-white p-6 rounded-[28px] shadow-2xl border border-gray-50 mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                            <FaPlus size={14} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest">Initialization</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Designation Label</label>
                            <input
                                type="text"
                                placeholder="e.g., Mathematics Command (Class 10)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-bold text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Academic Tier</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                    className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-bold text-sm appearance-none"
                                >
                                    {classesData.map((cls) => (
                                        <option key={cls.id} value={cls.id}>{cls.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Subject Vector</label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-bold text-sm appearance-none"
                                >
                                    <option value="all">Universal / General</option>
                                    {subjects.map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Execution Details (Requirements)</label>
                            <textarea
                                placeholder="Define candidate operational parameters..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-gray-50/50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-2.5 rounded-xl transition-all font-medium text-sm resize-none"
                            />
                        </div>
                        <button
                            onClick={handleAddJob}
                            disabled={!title.trim()}
                            className="w-full bg-[#1B2A5A] text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#142044] disabled:opacity-50 transition-all shadow-xl shadow-blue-900/10 mt-2"
                        >
                            Commit Posting to Relay
                        </button>
                    </div>
                </div>
            )}

            {/* Jobs List */}
            <div className="bg-white rounded-[28px] shadow-2xl border border-gray-50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white">
                    <h2 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                        Relay Stream
                    </h2>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                        {jobs.length} Active Nodes
                    </span>
                </div>
                {loading ? (
                    <div className="p-12 text-center animate-pulse">
                        <div className="inline-block w-8 h-8 border-2 border-t-[#a0522d] rounded-full animate-spin"></div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaBriefcase size={24} className="opacity-10" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">Relay Offline</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest">No active postings detected.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {jobs.map((job) => (
                            <div key={job.id} className="p-6 hover:bg-orange-50/10 transition-all duration-300 group relative">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-black text-gray-900 group-hover:text-[#a0522d] transition-colors">{job.title}</h3>
                                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] ${job.is_active ? 'bg-green-100 text-green-600 border border-green-200/50' : 'bg-red-50 text-red-600 border border-red-200/50'}`}>
                                                {job.is_active ? 'TRANSMITTING' : 'PAUSED'}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="bg-gray-50 text-gray-400 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-gray-100">Tier: {job.class_id}</span>
                                            {job.subject_id ? (
                                                <span className="bg-blue-50/50 text-blue-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-blue-100/50">Subject Linked</span>
                                            ) : (
                                                <span className="bg-orange-50/50 text-[#a0522d] px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-orange-100/50">General Protocol</span>
                                            )}
                                            <span className="text-gray-300 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {job.description && (
                                            <div className="relative pl-4">
                                                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-orange-100 rounded-full"></div>
                                                <p className="text-gray-500 text-[11px] leading-relaxed italic font-medium">
                                                    "{job.description}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleJobStatus(job)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${job.is_active ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
                                            title={job.is_active ? 'Pause Sync' : 'Resume Sync'}
                                        >
                                            {job.is_active ? <FaTimes size={10} /> : <FaCheck size={10} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteJob(job.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all font-black text-xs"
                                            title="Purge Node"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminJobs;
