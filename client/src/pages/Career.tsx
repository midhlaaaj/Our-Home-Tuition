import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ApplicationForm from '../components/ApplicationForm';
import { supabase } from '../supabaseClient';
import { FaBriefcase, FaGraduationCap, FaChevronRight, FaRegClipboard } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';

interface Job {
    id: string;
    title: string;
    description: string;
    class_id: number;
    subject_id: string | null;
}

const Career: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('apply') === 'general') {
            setShowForm(true);
            setSelectedJob(null);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setJobs(data || []);
            } catch (err) {
                console.error('Error fetching jobs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleApply = (job: Job | null) => {
        setSelectedJob(job);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-24">

                    {showForm ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button
                                onClick={() => setShowForm(false)}
                                className="mb-6 text-[#a0522d] font-bold flex items-center gap-2 hover:translate-x-[-2px] transition-transform opacity-80 hover:opacity-100"
                            >
                                ← Back to Careers
                            </button>
                            <ApplicationForm job={selectedJob} onSuccess={() => setShowForm(false)} />
                        </div>
                    ) : (
                        <>
                            {/* Hero Section */}
                            <div className="text-center mb-16">
                                <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
                                    Join Our <span className="text-[#a0522d]">Teaching</span> Excellence
                                </h1>
                                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                                    Empower the next generation. We're looking for passionate educators to provide
                                    quality home tuition and personalized learning experiences.
                                </p>
                            </div>

                            {/* Jobs Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="bg-white h-64 rounded-3xl shadow-sm border border-gray-100 animate-pulse"></div>
                                    ))
                                ) : jobs.length > 0 ? (
                                    jobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#a0522d] mb-6 group-hover:bg-[#a0522d] group-hover:text-white transition-colors">
                                                <FaBriefcase size={20} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h3>
                                            <div className="flex gap-3 mb-6">
                                                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Class {job.class_id}
                                                </span>
                                                <span className="text-xs font-bold bg-orange-100 text-[#a0522d] px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Home Tuition
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-sm mb-8 line-clamp-3 leading-relaxed">
                                                {job.description || "Looking for a dedicated tutor to help students excel in their academic journey through personalized home sessions."}
                                            </p>
                                            <button
                                                onClick={() => handleApply(job)}
                                                className="w-full py-4 rounded-xl font-bold border-2 border-[#a0522d] text-[#a0522d] hover:bg-[#a0522d]/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                Apply Now <FaChevronRight size={12} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full h-48 flex items-center justify-center bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">
                                        No specific job openings at the moment.
                                    </div>
                                )}
                            </div>

                            {/* General Application Call to Action */}
                            <div className="bg-[#1F2937] rounded-[40px] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#a0522d]/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                <div className="relative z-10 max-w-2xl">
                                    <h2 className="text-4xl font-bold mb-6">Couldn't find the right role for you?</h2>
                                    <p className="text-gray-300 text-lg mb-10 leading-relaxed">
                                        We are always looking for exceptional talent. Submit a general application and
                                        we'll reach out when a suitable opportunity opens up.
                                    </p>
                                    <button
                                        onClick={() => handleApply(null)}
                                        className="bg-[#ffb76c] text-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-[#ffc585] transition-all shadow-md flex items-center gap-3"
                                    >
                                        <FaRegClipboard /> Open Application
                                    </button>
                                </div>
                                <div className="hidden lg:block absolute bottom-0 right-0 p-12 opacity-10">
                                    <FaGraduationCap size={240} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Career;
