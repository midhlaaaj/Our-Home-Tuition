import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaInbox, FaUsers, FaBriefcase, FaArrowRight, FaCalendarCheck } from 'react-icons/fa';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        queries: 0,
        bookings: 0,
        applicants: 0,
        jobs: 0
    });
    const [hasSyncError, setHasSyncError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setHasSyncError(false);
            try {
                // Using a more robust count method without 'head: true' if it's causing issues, 
                // but select('id') is enough for a count.
                const [queriesRes, bookingsRes, applicantsRes, jobsRes] = await Promise.all([
                    supabase.from('contact_queries').select('id', { count: 'exact' }).eq('is_resolved', false),
                    supabase.from('bookings').select('id', { count: 'exact' }).eq('status', 'pending'),
                    supabase.from('job_applications').select('id', { count: 'exact' }),
                    supabase.from('jobs').select('id', { count: 'exact' }).eq('is_active', true)
                ]);

                if (queriesRes.error || bookingsRes.error || applicantsRes.error || jobsRes.error) {
                    setHasSyncError(true);
                    if (queriesRes.error) console.error('Queries count error:', queriesRes.error);
                    if (bookingsRes.error) console.error('Bookings count error:', bookingsRes.error);
                }

                setStats({
                    queries: queriesRes.count || 0,
                    bookings: bookingsRes.count || 0,
                    applicants: applicantsRes.count || 0,
                    jobs: jobsRes.count || 0
                });
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setHasSyncError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            title: 'New Queries',
            count: stats.queries,
            icon: <FaInbox />,
            path: '/admin/queries',
            color: 'from-orange-400 to-orange-500',
            shadow: 'shadow-orange-200',
            label: 'Unresolved'
        },
        {
            title: 'Active Bookings',
            count: stats.bookings,
            icon: <FaCalendarCheck />,
            path: '/admin/bookings',
            color: 'from-blue-400 to-blue-600',
            shadow: 'shadow-blue-200',
            label: 'Pending'
        },
        {
            title: 'Total Applicants',
            count: stats.applicants,
            icon: <FaUsers />,
            path: '/admin/applications',
            color: 'from-[#1B2A5A] to-[#2a3a6a]',
            shadow: 'shadow-blue-200',
            label: 'Total Entries'
        },
        {
            title: 'Active Jobs',
            count: stats.jobs,
            icon: <FaBriefcase />,
            path: '/admin/jobs',
            color: 'from-green-500 to-green-600',
            shadow: 'shadow-green-200',
            label: 'Live Postings'
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#ffb76c]/20 border-t-[#ffb76c] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Command Center</h1>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Platform Orchestration & Oversight</p>
                </div>
                {hasSyncError ? (
                    <div id="sync-error-badge" className="px-4 py-2 bg-red-50 rounded-xl border border-red-100 shadow-sm flex items-center gap-2.5 animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Database Sync Error</span>
                    </div>
                ) : (
                    <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Core Engine: Optimal</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(card.path)}
                        className={`group relative bg-white p-6 rounded-[24px] text-gray-900 text-left transition-all duration-500 hover:scale-[1.02] border border-gray-100 shadow-xl overflow-hidden`}
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100`}>
                                    <span className="text-lg">{card.icon}</span>
                                </div>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{card.label}</span>
                            </div>

                            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-1">{card.title}</h3>
                            <div className="text-3xl font-black text-gray-900 tracking-tighter mb-4">{card.count}</div>

                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-[#a0522d] group-hover:gap-3 transition-all">
                                    Open Module <FaArrowRight size={8} />
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-gray-50 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                        <FaInbox size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Recent Synchronization</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Real-time system event log</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-100/50">
                                <FaUsers size={12} />
                            </div>
                            <div>
                                <p className="font-black text-gray-800 text-xs">New Applicant Logged</p>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Database Sync Complete</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">Live</span>
                    </div>
                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-[#1B2A5A] text-white rounded-lg flex items-center justify-center">
                                <FaInbox size={12} />
                            </div>
                            <div>
                                <p className="font-black text-gray-800 text-xs">Query Resolution Active</p>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">System Watchdog: Idle</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">Standby</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
