import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser, FaEnvelope, FaPhone, FaHistory, FaFileAlt, FaVideo, FaTrash } from 'react-icons/fa';

interface JobApplication {
    id: string;
    created_at: string;
    full_name: string;
    email: string;
    phone: string;
    experience: string;
    cv_url: string;
    video_url: string;
    job_id: string | null;
    jobs: {
        title: string;
    } | null;
}

// Compact Refined UI for Job Applications
const AdminApplications: React.FC = () => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select('*, jobs(title)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setApplications(data || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this application?')) return;
        try {
            const { error } = await supabase
                .from('job_applications')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchApplications();
            if (selectedApp?.id === id) setSelectedApp(null);
        } catch (err) {
            console.error('Error deleting application:', err);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Human Resources</h1>
                <p className="text-sm text-gray-500 font-medium italic">Review candidate submissions and portfolios.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* List Column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-[24px] shadow-xl border border-gray-50 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <h2 className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Active Submissions</h2>
                            <span className="bg-orange-100 text-[#a0522d] px-2 py-0.5 rounded-full text-[10px] font-black">{applications.length}</span>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center"><div className="inline-block w-5 h-5 border-2 border-t-[#a0522d] rounded-full animate-spin"></div></div>
                        ) : applications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs italic font-medium">No records found.</div>
                        ) : (
                            <div className="divide-y divide-gray-50 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApp(app)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-orange-50/50 ${selectedApp?.id === app.id ? 'bg-orange-50/80 border-r-4 border-r-[#a0522d]' : ''}`}
                                    >
                                        <div className="font-black text-gray-900 text-sm leading-tight">{app.full_name}</div>
                                        <div className="text-[10px] text-[#a0522d] font-black uppercase tracking-tight mt-1">
                                            {app.jobs?.title || 'Open Application'}
                                        </div>
                                        <div className="text-[9px] text-gray-400 mt-2 font-bold flex justify-between items-center">
                                            <span>{new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <button onClick={(e) => handleDelete(app.id, e)} className="text-gray-300 hover:text-red-500 transition-colors bg-white p-1 rounded-md shadow-sm border border-gray-50">
                                                <FaTrash size={8} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-2">
                    {selectedApp ? (
                        <div className="bg-white rounded-[24px] shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-6 bg-[#1B2A5A] text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{selectedApp.full_name}</h2>
                                        <p className="text-[#ffb76c] font-black mt-1 uppercase tracking-widest text-[10px]">Position: {selectedApp.jobs?.title || 'General'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Received Index</span>
                                        <p className="text-[11px] font-black text-white/90">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Contact Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                            <FaEnvelope size={12} />
                                        </div>
                                        <span className="text-[13px] font-black text-gray-900">{selectedApp.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                            <FaPhone size={12} />
                                        </div>
                                        <span className="text-[13px] font-black text-gray-900">{selectedApp.phone}</span>
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FaHistory size={10} className="text-[#a0522d]" /> Candidate Background
                                    </h3>
                                    <div className="p-5 bg-orange-50/30 rounded-2xl border-2 border-orange-100/50 text-gray-800 text-[13px] leading-relaxed font-medium">
                                        {selectedApp.experience || 'No profile details provided.'}
                                    </div>
                                </div>

                                {/* Assets */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <FaFileAlt size={10} className="text-blue-500" /> Resume / CV
                                        </h3>
                                        {selectedApp.cv_url ? (
                                            <a
                                                href={selectedApp.cv_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-100 rounded-2xl hover:bg-blue-50/50 transition-all group bg-white"
                                            >
                                                <FaFileAlt size={24} className="text-blue-400 group-hover:scale-110 transition-transform mb-2" />
                                                <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Access Document</span>
                                            </a>
                                        ) : (
                                            <div className="p-6 bg-gray-50 rounded-2xl text-center text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200">Missing CV</div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <FaVideo size={10} className="text-red-500" /> Video Pitch
                                        </h3>
                                        {selectedApp.video_url ? (
                                            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-xl bg-black aspect-video flex items-center justify-center relative">
                                                <video
                                                    src={selectedApp.video_url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">External Link</div>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-gray-50 rounded-2xl text-center text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200">No Video Submission</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[450px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400 space-y-4 shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                <FaUser size={24} className="opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Personnel Selector</p>
                                <p className="text-gray-400 text-xs font-medium mt-1">Select a candidate profile from the left pane.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminApplications;
