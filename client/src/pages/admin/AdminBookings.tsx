import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    FaEnvelope, FaPhone,
    FaCheckCircle, FaUndo, FaFileCsv, FaFileExcel
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface Booking {
    id: string;
    created_at: string;
    class_id: number;
    curriculum: string;
    selected_units: any[];
    primary_student: any;
    class_type: string;
    additional_students: any[];
    status: string;
    assigned_mentor_id: string | null;
    preferred_date: string | null;
    preferred_time: string | null;
    selected_time: string | null;
    session_mode: string;
    otp: string | null;
    deleted_at?: string | null;
    paid_amount: number;
    razorpay_payment_id: string | null;
}

interface Mentor {
    id: string;
    name: string;
    subject: string;
}

const AdminBookings: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedMentors, setSelectedMentors] = useState<Record<string, string>>({});
    
    // History & Filtering States
    const [viewMode, setViewMode] = useState<'manage' | 'history'>('manage');
    const [dateFilter, setDateFilter] = useState('all'); // all, daily, weekly, monthly
    const [mentorFilter, setMentorFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, mentorsRes] = await Promise.all([
                supabase.from('bookings').select('*').order('created_at', { ascending: false }),
                supabase.from('mentors').select('id, name, subject')
            ]);

            if (bookingsRes.error) throw bookingsRes.error;
            if (mentorsRes.error) throw mentorsRes.error;

            setBookings(bookingsRes.data || []);
            setMentors(mentorsRes.data || []);

            // Initialize selected mentors
            const mentorsMap = (bookingsRes.data || []).reduce((acc: any, b: any) => ({
                ...acc,
                [b.id]: b.assigned_mentor_id || 'unassigned'
            }), {});
            setSelectedMentors(mentorsMap);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const prepareExportData = () => {
        return historyBookings.map(b => ({
            'Student Name': b.primary_student?.name || 'N/A',
            'Class/Level': `Level ${b.class_id}`,
            'Curriculum': b.curriculum,
            'Time': b.selected_time || b.preferred_time || 'TBD',
            'OTP': b.otp || 'N/A',
            'Attendance': b.status === 'completed' ? 'Validated' : 'Pending',
            'Mentor': mentors.find(m => m.id === b.assigned_mentor_id)?.name || 'N/A',
            'Date': new Date(b.created_at).toLocaleDateString()
        }));
    };

    const handleExportCSV = () => {
        const data = prepareExportData();
        if (data.length === 0) return alert("No data to export");
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `booking_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        const data = prepareExportData();
        if (data.length === 0) return alert("No data to export");

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "History");
        XLSX.writeFile(workbook, `booking_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleAssignMentor = async (bookingId: string, mentorId: string) => {
        try {
            const status = mentorId === 'unassigned' ? 'pending' : 'awaiting_approval';
            const { error } = await supabase
                .from('bookings')
                .update({
                    assigned_mentor_id: mentorId === 'unassigned' ? null : mentorId,
                    status: status
                })
                .eq('id', bookingId);

            if (error) throw error;
            setBookings(bookings.map(b => b.id === bookingId ? { ...b, assigned_mentor_id: mentorId === 'unassigned' ? null : mentorId, status } : b));
            alert(mentorId === 'unassigned' ? "Mentor unassigned." : "Mentor assigned! Awaiting mentor's acceptance.");
        } catch (err) {
            console.error('Error assigning mentor:', err);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleDeleteBooking = async (id: string, permanent: boolean = false) => {
        if (!window.confirm(`Are you sure you want to ${permanent ? 'permanently' : 'delete'} this booking?`)) return;
        try {
            if (permanent) {
                const { error } = await supabase.from('bookings').delete().eq('id', id);
                if (error) throw error;
                setBookings(bookings.filter(b => b.id !== id));
            } else {
                const { error } = await supabase.from('bookings').update({ deleted_at: new Date().toISOString() }).eq('id', id);
                if (error) throw error;
                setBookings(bookings.map(b => b.id === id ? { ...b, deleted_at: new Date().toISOString() } : b));
            }
        } catch (err) {
            console.error('Error deleting booking:', err);
        }
    };


    const filteredBookings = bookings.filter(b => {
        if (filter === 'deleted') return b.deleted_at !== null;
        if (b.deleted_at) return false;
        return filter === 'all' || b.status === filter;
    });

    const historyBookings = bookings.filter(b => {
        if (b.status !== 'confirmed' && b.status !== 'completed') return false;
        if (mentorFilter !== 'all' && b.assigned_mentor_id !== mentorFilter) return false;
        if (dateFilter !== 'all') {
            const bookingDate = new Date(b.created_at);
            const now = new Date();
            if (dateFilter === 'daily') return bookingDate.toDateString() === now.toDateString();
            if (dateFilter === 'weekly') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                return bookingDate >= weekAgo;
            }
            if (dateFilter === 'monthly') return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const totalRevenue = historyBookings.reduce((acc, b) => acc + (b.paid_amount || 0), 0);
    const dailyRevenue = bookings.filter(b => {
        const d = new Date(b.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString() && (b.status === 'confirmed' || b.status === 'completed');
    }).reduce((acc, b) => acc + (b.paid_amount || 0), 0);


    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 font-['Urbanist']">
            <Link 
                to="/admin/operations" 
                className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#1B2A5A] transition-colors uppercase tracking-widest mb-2 group w-fit"
            >
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                Back to Operations
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {viewMode === 'manage' ? 'Booking Management' : 'Booking History'}
                    </h1>
                    <p className="text-sm font-bold text-[#1B2A5A] mt-1">
                        {viewMode === 'manage' ? 'Review and assign mentors' : 'Access detailed session records and attendance'}
                    </p>
                </div>
                
                <div className="flex w-fit self-start gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setViewMode('manage')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'manage' ? 'bg-[#1B2A5A] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        Management
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-[#1B2A5A] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {viewMode === 'manage' ? (
                <>
                    <div className="flex gap-2 bg-white/50 p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar self-start">
                        {['all', 'pending', 'awaiting_approval', 'confirmed', 'cancelled', 'deleted'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-[#a0522d] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {loading && bookings.length === 0 ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-xl animate-pulse">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        <div className="flex-1 space-y-6">
                                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                            <div className="h-8 bg-gray-100 rounded w-1/2"></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-10 bg-gray-50 rounded-2xl"></div>
                                                <div className="h-10 bg-gray-50 rounded-2xl"></div>
                                            </div>
                                        </div>
                                        <div className="lg:w-80 h-32 bg-gray-900 rounded-[24px]"></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredBookings.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-gray-100">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No bookings found for this filter</p>
                            </div>
                        ) : (
                            filteredBookings.map((booking) => (
                            <motion.div layout key={booking.id} className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden group hover:border-[#ffb76c]/30 transition-all duration-500">
                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                                                        {booking.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {booking.id.slice(0, 8)}</span>
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900">{booking.primary_student?.name}</h3>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs font-black text-[#a0522d] uppercase tracking-widest mt-1">{booking.curriculum} • Level {booking.class_id}</p>
                                                    {booking.paid_amount > 0 && (
                                                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter mt-1">
                                                            Paid: ₹{booking.paid_amount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                                    <FaEnvelope className="text-gray-400" size={12} />
                                                    <span className="text-xs font-bold text-gray-600 truncate">{booking.primary_student?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                                    <FaPhone className="text-gray-400" size={12} />
                                                    <span className="text-xs font-bold text-gray-600">{booking.primary_student?.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:w-80">
                                            <div className="p-5 bg-gray-900 rounded-[24px] space-y-4">
                                                <select
                                                    value={selectedMentors[booking.id] || 'unassigned'}
                                                    onChange={(e) => setSelectedMentors(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-[#ffb76c] transition-all cursor-pointer appearance-none"
                                                    disabled={booking.status === 'confirmed'}
                                                >
                                                    <option value="unassigned" className="bg-[#1F2937]">Select Mentor</option>
                                                    {mentors.map(m => <option key={m.id} value={m.id} className="bg-[#1F2937] text-white">{m.name}</option>)}
                                                </select>
                                                <div className="flex gap-2">
                                                    {booking.status === 'pending' ? (
                                                        <button onClick={() => handleAssignMentor(booking.id, selectedMentors[booking.id])} disabled={selectedMentors[booking.id] === 'unassigned'} className="flex-1 bg-[#ffb76c] text-[#1B2A5A] rounded-xl py-3 text-[9px] font-black uppercase tracking-widest">Assign</button>
                                                    ) : booking.status === 'awaiting_approval' && (
                                                        <button onClick={() => handleUpdateStatus(booking.id, 'confirmed')} className="flex-1 bg-green-500 text-white rounded-xl py-3 text-[9px] font-black uppercase tracking-widest">Confirm</button>
                                                    )}
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="flex-1 bg-white/5 text-white/40 rounded-xl py-3 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-all">Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    {/* Revenue Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Revenue', value: totalRevenue, color: 'bg-[#1B2A5A]', icon: '₹' },
                            { label: 'Today', value: dailyRevenue, color: 'bg-green-600', icon: '₹' },
                            { label: 'Filtered Sessions', value: historyBookings.length, color: 'bg-[#a0522d]', icon: '#' },
                            { label: 'Avg / Session', value: historyBookings.length ? Math.round(totalRevenue / historyBookings.length) : 0, color: 'bg-orange-500', icon: '₹' }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.color} p-6 rounded-[32px] text-white shadow-xl flex items-center justify-between`}>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                                    <h4 className="text-2xl font-black">{stat.icon}{stat.value}</h4>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center font-black">{stat.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#1B2A5A] px-1">Mentor</label>
                            <select value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none">
                                <option value="all">All Mentors</option>
                                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#1B2A5A] px-1">Period</label>
                            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 outline-none">
                                <option value="all">Anytime</option>
                                <option value="daily">Today</option>
                                <option value="weekly">This Week</option>
                                <option value="monthly">This Month</option>
                            </select>
                        </div>
                        <button onClick={fetchData} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-[#a0522d] transition-colors"><FaUndo size={14} /></button>
                        
                        <div className="flex gap-2 ml-auto">
                            <button 
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                            >
                                <FaFileCsv size={14} className="text-blue-500" /> Export CSV
                            </button>
                            <button 
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-green-600 hover:border-green-100 transition-all shadow-sm"
                            >
                                <FaFileExcel size={14} className="text-green-500" /> Export Excel
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-8 py-6">Student Info</th>
                                        <th className="px-6 py-6">Session Details</th>
                                        <th className="px-6 py-6">Payment</th>
                                        <th className="px-6 py-6">Mentor</th>
                                        <th className="px-6 py-6 text-right">Attendance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading && bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 animate-pulse">
                                                    <div className="w-10 h-10 border-2 border-[#ffb76c]/20 border-t-[#ffb76c] rounded-full animate-spin"></div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fetching history...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : historyBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                                No history found
                                            </td>
                                        </tr>
                                    ) : (
                                        historyBookings.map(b => (
                                            <tr key={b.id} className="group hover:bg-gray-50/50 transition-colors text-xs">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-gray-900">{b.primary_student?.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Level {b.class_id}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="font-bold text-gray-600">{b.curriculum}</p>
                                                    <p className="text-[10px] text-[#a0522d] font-black uppercase tracking-widest">{b.selected_time || b.preferred_time || 'TBD'}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="font-black text-gray-900">₹{b.paid_amount || 0}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{b.razorpay_payment_id || 'Cash/Other'}</p>
                                                </td>
                                                <td className="px-6 py-6 font-bold text-gray-600">{mentors.find(m => m.id === b.assigned_mentor_id)?.name || 'N/A'}</td>
                                                <td className="px-6 py-6 text-right">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${b.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        <FaCheckCircle size={10} /> {b.status === 'completed' ? 'Validated' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookings;
