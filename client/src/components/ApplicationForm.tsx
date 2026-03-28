import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { classesData } from '../constants/classesData';
import { FaFileUpload, FaVideo, FaCheck, FaChevronRight, FaLink, FaCloudUploadAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useFormPersistence } from '../hooks/useFormPersistence';

interface Job {
    id: string;
    title: string;
    class_id: number;
}

interface ApplicationFormProps {
    job: Job | null;
    onSuccess?: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ job, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Persistable form data
    const { formData, updateField, clearPersistence } = useFormPersistence({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        experience: '',
        classIds: job ? [job.class_id] : [] as number[],
        subjectIds: [] as string[],
        videoLink: ''
    });

    // File/Video states
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSource, setVideoSource] = useState<'upload' | 'link'>('upload');

    // Fetch subjects for general applications
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    useEffect(() => {
        const fetchAllSubjects = async () => {
            const { data } = await supabase.from('class_subjects').select('id, name, class_id');
            setAllSubjects(data || []);
        };
        fetchAllSubjects();
    }, []);

    const filteredSubjects = allSubjects.filter(sub => formData.classIds.includes(sub.class_id));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'video') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'cv') setCvFile(e.target.files[0]);
            else setVideoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email || formData.phone.length !== 10) {
            alert("Please fill in all contact details correctly.");
            return;
        }

        if (!job && (formData.classIds.length === 0 || formData.subjectIds.length === 0)) {
            alert("Please select at least one class and subject.");
            return;
        }

        if (!cvFile) {
            alert("Please upload your CV/Resume.");
            return;
        }

        if (videoSource === 'upload' && !videoFile) {
            alert("Please upload your teaching demonstration video.");
            return;
        }

        if (videoSource === 'link' && !formData.videoLink) {
            alert("Please provide a link to your teaching demonstration.");
            return;
        }

        setLoading(true);

        try {
            let cvUrl = '';
            let finalVideoUrl = formData.videoLink;

            if (cvFile) {
                const fileExt = cvFile.name.split('.').pop();
                const fileName = `${Date.now()}_cv_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error } = await supabase.storage.from('resumes').upload(fileName, cvFile);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);
                cvUrl = publicUrl;
            }

            if (videoSource === 'upload' && videoFile) {
                const fileExt = videoFile.name.split('.').pop();
                const fileName = `${Date.now()}_video_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error } = await supabase.storage.from('intro-videos').upload(fileName, videoFile);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('intro-videos').getPublicUrl(fileName);
                finalVideoUrl = publicUrl;
            }

            const { error } = await supabase
                .from('job_applications')
                .insert([{
                    job_id: job?.id || null,
                    full_name: formData.fullName,
                    email: formData.email,
                    phone: `+91 ${formData.phone}`,
                    address: formData.address,
                    experience: formData.experience,
                    class_ids: formData.classIds,
                    subject_ids: formData.subjectIds,
                    cv_url: cvUrl,
                    video_url: finalVideoUrl
                }]);

            if (error) throw error;
            setSubmitted(true);
            clearPersistence();
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 3000);

        } catch (err: any) {
            console.error('Submission error:', err);
            alert(`Failed to submit application: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center border border-gray-100">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FaCheck size={40} />
                </div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">Application Submitted!</h2>
                <p className="text-gray-500 text-lg">Thank you for applying. Our team will review your application and get back to you soon.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 lg:p-12 rounded-[40px] shadow-2xl border border-gray-100 mb-20">
            <h2 className="text-4xl font-black text-gray-800 mb-2">
                {job ? `Apply for ${job.title}` : 'Join Our Talent Pool'}
            </h2>
            <p className="text-gray-500 mb-10 font-medium">Please fill in your details and provide a 3-minute teaching demonstration.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-[#1B2A5A] ml-1">Full Name</span>
                            <input
                                required
                                type="text"
                                value={formData.fullName}
                                onChange={e => updateField('fullName', e.target.value)}
                                className="mt-1 w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none transition-all font-medium"
                                placeholder="Enter your name"
                            />
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-bold text-[#1B2A5A] ml-1">Email</span>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => updateField('email', e.target.value)}
                                    className="mt-1 w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none transition-all font-medium"
                                    placeholder="name@email.com"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-[#1B2A5A] ml-1">Phone Number</span>
                                <div className="mt-1 relative group flex items-center bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-[#a0522d] focus-within:bg-white transition-all overflow-hidden font-medium">
                                    <div className="flex items-center pl-5 pr-3 text-gray-400 group-focus-within:text-[#a0522d] border-r border-gray-200 py-4 h-full">
                                        <span className="font-black text-sm">+91</span>
                                    </div>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full px-3 py-4 bg-transparent outline-none"
                                        placeholder="00000 00000"
                                    />
                                </div>
                            </label>
                        </div>

                        <label className="block">
                            <span className="text-sm font-bold text-[#1B2A5A] ml-1">Work Address / Location</span>
                            <div className="mt-1 relative group">
                                <FaMapMarkerAlt className="absolute left-5 top-5 text-gray-400 group-focus-within:text-[#a0522d]" />
                                <input
                                    required
                                    type="text"
                                    value={formData.address}
                                    onChange={e => updateField('address', e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none transition-all font-medium"
                                    placeholder="Enter your city or area"
                                />
                            </div>
                        </label>

                        {!job && (
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-bold text-[#1B2A5A] ml-1">Preferred Classes</span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {classesData.map(cls => (
                                            <button
                                                key={cls.id}
                                                type="button"
                                                onClick={() => {
                                                    const cur = formData.classIds;
                                                    updateField('classIds', cur.includes(cls.id) ? cur.filter(id => id !== cls.id) : [...cur, cls.id]);
                                                }}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.classIds.includes(cls.id) ? 'bg-[#a0522d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {cls.label}
                                            </button>
                                        ))}
                                    </div>
                                </label>
                                {formData.classIds.length > 0 && (
                                    <label className="block animate-in fade-in slide-in-from-top-2">
                                        <span className="text-sm font-bold text-[#1B2A5A] ml-1">Preferred Subjects</span>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {filteredSubjects.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = formData.subjectIds;
                                                        updateField('subjectIds', cur.includes(sub.id) ? cur.filter(id => id !== sub.id) : [...cur, sub.id]);
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.subjectIds.includes(sub.id) ? 'bg-orange-100 text-[#a0522d] border border-[#a0522d]' : 'bg-gray-50 text-gray-400 border border-transparent'}`}
                                                >
                                                    {sub.name} (Class {sub.class_id})
                                                </button>
                                            ))}
                                        </div>
                                    </label>
                                )}
                            </div>
                        )}

                        <label className="block">
                            <span className="text-sm font-bold text-[#1B2A5A] ml-1 italic opacity-60">Teaching Experience (Optional)</span>
                            <textarea
                                rows={4}
                                value={formData.experience}
                                onChange={e => updateField('experience', e.target.value)}
                                className="mt-1 w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none transition-all font-medium resize-none"
                                placeholder="Briefly describe your teaching background..."
                            />
                        </label>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200">
                        <h4 className="flex items-center gap-2 font-bold text-blue-700 mb-3">
                            <FaFileUpload /> Upload CV / Resume
                        </h4>
                        <input
                            type="file"
                            id="cv-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={e => handleFileUpload(e, 'cv')}
                        />
                        <label
                            htmlFor="cv-upload"
                            className="cursor-pointer flex items-center justify-between bg-white p-3 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
                        >
                            <span className="text-sm font-medium text-gray-500 truncate mr-2">
                                {cvFile ? cvFile.name : 'Choose a file (PDF, Doc)'}
                            </span>
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0">
                                {cvFile ? 'Change' : 'Browse'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 shadow-sm h-full flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <FaVideo className="text-[#a0522d]" /> Teaching Demonstration
                        </h3>

                        <div className="flex gap-4 mb-8 p-1 bg-gray-200 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setVideoSource('upload')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${videoSource === 'upload' ? 'bg-white text-[#a0522d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FaCloudUploadAlt /> Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setVideoSource('link')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${videoSource === 'link' ? 'bg-white text-[#a0522d] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FaLink /> Provide Link
                            </button>
                        </div>

                        <div className="flex-grow flex flex-col justify-center">
                            {videoSource === 'upload' ? (
                                <div className="animate-in fade-in duration-300">
                                    <div className="text-center p-10 border-2 border-dashed border-[#a0522d]/20 rounded-[32px] bg-white group hover:border-[#a0522d]/40 transition-all">
                                        <input
                                            type="file"
                                            id="video-upload"
                                            className="hidden"
                                            accept="video/*"
                                            onChange={e => handleFileUpload(e, 'video')}
                                        />
                                        <FaCloudUploadAlt size={48} className="text-[#a0522d]/30 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                        <h4 className="font-bold text-gray-700 mb-2">Select Video File</h4>
                                        <p className="text-xs text-gray-400 mb-6">MP4, WebM or MOV (Max 50MB)</p>
                                        <label
                                            htmlFor="video-upload"
                                            className="cursor-pointer bg-[#a0522d] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#804224] transition-all"
                                        >
                                            {videoFile ? 'Change Video' : 'Choose File'}
                                        </label>
                                        {videoFile && (
                                            <p className="mt-4 text-xs font-bold text-green-600 flex items-center justify-center gap-1">
                                                <FaCheck /> {videoFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300 space-y-4">
                                    <label className="block">
                                        <span className="text-sm font-bold text-gray-700 ml-1">Video URL</span>
                                        <div className="mt-2 relative group">
                                            <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a0522d]" />
                                            <input
                                                type="url"
                                                value={formData.videoLink}
                                                onChange={e => updateField('videoLink', e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-gray-100 focus:border-[#a0522d] outline-none transition-all font-medium"
                                                placeholder="YouTube, Google Drive, or Loom link"
                                            />
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-6 bg-white rounded-3xl border border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2 uppercase tracking-widest">
                                Tips
                            </h4>
                            <ul className="space-y-2 text-xs text-gray-500 font-medium">
                                <li className="flex items-start gap-2">• Demonstrate your best topic</li>
                                <li className="flex items-start gap-2">• Clear audio is essential</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-gray-400 text-sm max-w-sm text-center sm:text-left">
                    Your details will be remembered for future applications.
                </p>
                <button
                    disabled={loading}
                    type="submit"
                    className="w-full sm:w-auto bg-[#a0522d] text-white px-12 py-5 rounded-[24px] font-black text-xl hover:bg-[#b0623d] disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-4"
                >
                    {loading ? 'Submitting...' : 'Submit Application'}
                    <FaChevronRight size={16} />
                </button>
            </div>
        </form>
    );
};

export default ApplicationForm;
