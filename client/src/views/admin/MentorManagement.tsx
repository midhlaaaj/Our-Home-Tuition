import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaUsers, FaSearch, FaFilter, FaChevronRight, FaCalendarCheck, 
    FaClock, FaCheckCircle, FaExclamationCircle, FaUser, FaInfoCircle,
    FaArrowLeft, FaHistory, FaCreditCard, FaLock
} from 'react-icons/fa';
import { format } from 'date-fns';

const MentorManagement: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
    const [mentorStats, setMentorStats] = useState<any>(null);
    const [mentorBookings, setMentorBookings] = useState<any[]>([]);
    const [incentiveClaims, setIncentiveClaims] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setMentors(data || []);
        } catch (err) {
            console.error('Error fetching mentors:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMentorDetails = async (mentor: any) => {
        setSelectedMentor(mentor);
        setDetailsLoading(true);
        try {
            // 1. Fetch all bookings for this mentor
            const { data: bookings, error: bookingError } = await supabase
                .from('bookings')
                .select('*')
                .eq('assigned_mentor_id', mentor.id)
                .order('created_at', { ascending: false });

            if (bookingError) throw bookingError;

            // 2. Fetch incentive claims
            const { data: claims, error: claimsError } = await supabase
                .from('incentive_claims')
                .select('*')
                .eq('mentor_id', mentor.id)
                .order('created_at', { ascending: false });

            if (claimsError) throw claimsError;

            setMentorBookings(bookings || []);
            setIncentiveClaims(claims || []);

            // 3. Calculate Stats
            const completed = (bookings || []).filter((b: any) => b.status === 'completed').length;
            const planned = (bookings || []).filter((b: any) => b.status === 'pending' || b.status === 'confirmed').length;
            const offlineCompleted = (bookings || []).filter((b: any) => 
                b.status === 'completed' && 
                (b.session_mode === 'offline' || !b.session_mode) &&
                !b.claimed_for_incentive
            ).length;

            setMentorStats({
                completed,
                planned,
                offlineCompleted, // For the current bar
                nextIncentiveAt: 10 - (offlineCompleted % 10)
            });

        } catch (err) {
            console.error('Error fetching mentor details:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleUpdateClaimStatus = async (claimId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('incentive_claims')
                .update({ status: newStatus })
                .eq('id', claimId);

            if (error) throw error;
            
            // Refresh claims
            setIncentiveClaims(incentiveClaims.map(c => 
                c.id === claimId ? { ...c, status: newStatus } : c
            ));
        } catch (err) {
            console.error('Error updating claim:', err);
        }
    };

    const filteredMentors = mentors.filter(m => 
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedMentor) {
        return (
            <div className="space-y-6 font-['Urbanist']">
                <button 
                    onClick={() => setSelectedMentor(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors font-black text-xs uppercase tracking-widest"
                >
                    <FaArrowLeft size={10} /> Back to Mentors
                </button>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FaUser size={120} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedMentor.name}</h2>
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">{selectedMentor.subject} • {selectedMentor.email}</p>
                            
                            <div className="flex flex-wrap gap-3 mt-6">
                                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    {selectedMentor.qualification || 'No Qualification'}
                                </span>
                                <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                    {selectedMentor.location_address || 'No Location'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="text-2xl font-black text-[#1B2A5A]">{mentorStats?.completed || 0}</div>
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Completed Sessions</div>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <div className="text-2xl font-black text-[#a0522d]">{mentorStats?.planned || 0}</div>
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Planned Sessions</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Session History */}
                    <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Session History</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Comprehensive audit trail</p>
                            </div>
                            <FaHistory className="text-gray-100" size={32} />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent / Student</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Incentived</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailsLoading ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading sessions...</td></tr>
                                    ) : mentorBookings.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-black text-xs uppercase tracking-widest">No sessions found</td></tr>
                                    ) : (
                                        mentorBookings.map((b) => (
                                            <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="font-black text-xs text-gray-900">{b.parent_name || 'N/A'}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Contact: {b.parent_phone || 'N/A'}</div>
                                                </td>
                                                <td className="px-8 py-5 text-[11px] font-bold text-gray-600">
                                                    {b.slot_date ? format(new Date(b.slot_date), 'dd MMM yyyy') : 'N/A'}
                                                </td>
                                                <td className="px-8 py-5 uppercase tracking-widest">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${
                                                        b.session_mode === 'offline' || !b.session_mode ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        {b.session_mode || 'offline'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        b.status === 'completed' ? 'bg-green-50 text-green-600' : 
                                                        b.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                                                    }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {b.claimed_for_incentive ? (
                                                        <FaCheckCircle className="text-green-500 mx-auto" size={14} />
                                                    ) : (
                                                        <FaClock className="text-gray-100 mx-auto" size={14} />
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Incentive Claims */}
                    <div className="space-y-6">
                        <div className="bg-[#1B2A5A] p-8 rounded-[40px] text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <FaCreditCard size={60} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-70">Incentive Claims</h3>
                                <div className="space-y-4">
                                    {incentiveClaims.length === 0 ? (
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">No claims raised yet</p>
                                        </div>
                                    ) : (
                                        incentiveClaims.map((claim) => (
                                            <div key={claim.id} className="p-4 bg-white/10 rounded-3xl border border-white/10 flex items-center justify-between group">
                                                <div>
                                                    <div className="text-xl font-black tracking-tight">{claim.amount}</div>
                                                    <div className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">Raised {format(new Date(claim.created_at), 'dd MMM')}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                        claim.status === 'paid' ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                                                    }`}>
                                                        {claim.status}
                                                    </span>
                                                    {claim.status === 'pending' && (
                                                        <button 
                                                            onClick={() => handleUpdateClaimStatus(claim.id, 'paid')}
                                                            className="text-[8px] font-black uppercase tracking-widest text-[#ffb76c] hover:underline"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <FaLock size={40} />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Incentive Eligibility</h3>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-black text-gray-900 tracking-tighter">{mentorStats?.offlineCompleted || 0}</span>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest pb-1.5">Unclaimed Gigs</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#1B2A5A] transition-all duration-1000" 
                                    style={{ width: `${Math.min(((mentorStats?.offlineCompleted || 0) / 10) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-4 leading-relaxed">
                                {mentorStats?.offlineCompleted >= 10 
                                    ? "This mentor has reached the milestone and can raise an invoice."
                                    : `${10 - (mentorStats?.offlineCompleted || 0)} more sessions needed for the ₹1000 incentive.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mentor Management</h1>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Review sessions, track progress & manage payouts</p>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                        <FaSearch size={14} />
                    </div>
                    <input 
                        type="search" 
                        placeholder="Search mentors by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl w-full md:w-80 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B2A5A]/5 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mentor Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Expertise</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-black text-xs uppercase tracking-widest animate-pulse">Synchronizing Mentors...</td></tr>
                            ) : filteredMentors.length === 0 ? (
                                <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-black text-xs uppercase tracking-widest">No mentors found</td></tr>
                            ) : (
                                filteredMentors.map((m) => (
                                    <tr 
                                        key={m.id} 
                                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-all cursor-pointer group"
                                        onClick={() => fetchMentorDetails(m)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1B2A5A] font-black text-xs group-hover:scale-110 transition-transform duration-300">
                                                    {m.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-gray-900">{m.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 lowercase tracking-tight">{m.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100">
                                                {m.subject || 'All Subjects'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-gray-500">
                                            {m.location_address || 'Not Provided'}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button className="p-2 bg-gray-50 text-[#1B2A5A] rounded-xl hover:bg-[#1B2A5A] hover:text-white transition-all shadow-sm">
                                                <FaChevronRight size={12} />
                                            </button>
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

export default MentorManagement;
