import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';
import {
    FaCalendarCheck, FaEnvelope, FaPhone, FaMapMarkerAlt,
    FaChalkboardTeacher, FaCheckCircle, FaUsers, FaTrash, FaUndo, FaHistory,
    FaCalendarAlt, FaClock, FaWifi, FaHome
} from 'react-icons/fa';

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
    session_mode: string;
    deleted_at?: string | null;
}

interface Mentor {
    id: string;
    name: string;
    subject: string;
}

interface Availability {
    mentor_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

const AdminBookings: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedMentors, setSelectedMentors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, mentorsRes, availabilityRes] = await Promise.all([
                supabase.from('bookings').select('*').order('created_at', { ascending: false }),
                supabase.from('mentors').select('id, name, subject'),
                supabase.from('mentor_availability').select('*')
            ]);

            if (bookingsRes.error) throw bookingsRes.error;
            if (mentorsRes.error) throw mentorsRes.error;
            if (availabilityRes.error) throw availabilityRes.error;

            setBookings(bookingsRes.data || []);
            setMentors(mentorsRes.data || []);
            setAvailability(availabilityRes.data || []);

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
            setBookings(bookings.map(b => b.id === bookingId ? {
                ...b,
                assigned_mentor_id: mentorId === 'unassigned' ? null : mentorId,
                status: status
            } : b));
        } catch (err) {
            console.error('Error assigning mentor:', err);
        }
    };

    const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
        try {
            // 1. Fetch current status and OTP if we are confirming
            let currentOtp = '---';
            let userId = '';
            let shouldSendNotification = false;

            if (newStatus === 'confirmed') {
                const { data: bookingData, error: fetchError } = await supabase
                    .from('bookings')
                    .select('user_id, otp, status')
                    .eq('id', bookingId)
                    .single();

                if (fetchError || !bookingData) throw new Error("Could not fetch booking details");

                // If already confirmed, just synchronize local state and finish
                if (bookingData.status === 'confirmed') {
                    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b));
                    alert("Booking is already confirmed.");
                    return;
                }

                if (!bookingData.user_id) throw new Error("No parent ID associated with this booking");
                
                userId = bookingData.user_id;
                shouldSendNotification = true;

                // 3. OTP Recovery: Generate if missing
                currentOtp = bookingData.otp;
                if (!currentOtp || currentOtp === '---') {
                    currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    await supabase
                        .from('bookings')
                        .update({ otp: currentOtp })
                        .eq('id', bookingId);
                }
            }

            // 4. Update the actual status
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId);

            if (updateError) throw updateError;
            
            // 5. Notify Parent
            if (shouldSendNotification) {
                const { error: notifError } = await supabase.from('notifications').insert({
                    user_id: userId,
                    title: 'Booking Confirmed!',
                    message: `Your booking has been confirmed by the administration. Your Session OTP is: ${currentOtp}. ⚠️ Do not share this OTP at any other time except during the session.`,
                    type: 'booking_confirmed'
                });

                if (notifError) {
                    console.error("Notification Error:", notifError);
                    alert("Status updated, but failed to notify parent: " + notifError.message);
                } else {
                    console.log("Notification sent successfully to:", userId);
                    alert("Booking confirmed and parent notified!");
                }
            }

            setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus, otp: currentOtp } : b));
            alert(`Booking status updated to ${newStatus}`);
        } catch (err: any) {
            console.error('Error updating status:', err);
            alert("Error: " + err.message);
        }
    };

    const isMentorAvailable = (mentorId: string, booking: Booking) => {
        if (!booking.preferred_date || !booking.preferred_time) return true;

        try {
            // 1. Get day of week from date (Fix: Use local parts to avoid timezone shift)
            const [y, m, d] = booking.preferred_date.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const bookingDay = days[date.getDay()];

            // 2. Get mentor availability for that day
            const mentorAvail = availability.filter(a => a.mentor_id === mentorId && a.day_of_week === bookingDay);
            if (mentorAvail.length === 0) return false;

            // 3. Parse requested hours (they contain AM/PM from BookingPage)
            const requestedHours = booking.preferred_time.split(',').map(h => h.trim());
            
            return requestedHours.every(reqTime => {
                // Parse 12h format "09:00 AM" or "9:00 AM"
                const [timePart, ampm] = reqTime.split(' ');
                if (!timePart || !ampm) return false;

                const [hStr, mStr] = timePart.split(':');
                let reqH = parseInt(hStr);
                const reqM = parseInt(mStr);
                
                if (ampm === 'PM' && reqH < 12) reqH += 12;
                if (ampm === 'AM' && reqH === 12) reqH = 0;
                
                const reqTotal = reqH * 60 + reqM;

                return mentorAvail.some(avail => {
                    const [startH, startM] = avail.start_time.split(':').map(Number);
                    const [endH, endM] = avail.end_time.split(':').map(Number);
                    
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;
                    
                    return reqTotal >= startTotal && reqTotal < endTotal;
                });
            });
        } catch (e) {
            console.error('Availability check error:', e);
            return true;
        }
    };

    const handleDeleteBooking = async (id: string, permanent = false) => {
        if (!window.confirm(permanent ? "Permanently delete this booking? This cannot be undone." : "Move this booking to Recently Deleted?")) return;

        try {
            if (permanent) {
                const { error } = await supabase.from('bookings').delete().eq('id', id);
                if (error) throw error;
                setBookings(bookings.filter(b => b.id !== id));
            } else {
                const deleted_at = new Date().toISOString();
                const { error } = await supabase.from('bookings').update({ deleted_at }).eq('id', id);
                if (error) throw error;
                setBookings(bookings.map(b => b.id === id ? { ...b, deleted_at } : b));
            }
        } catch (err) {
            console.error('Error deleting booking:', err);
        }
    };

    const handleRestoreBooking = async (id: string) => {
        try {
            const { error } = await supabase.from('bookings').update({ deleted_at: null }).eq('id', id);
            if (error) throw error;
            setBookings(bookings.map(b => b.id === id ? { ...b, deleted_at: null } : b));
        } catch (err) {
            console.error('Error restoring booking:', err);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === 'deleted') return b.deleted_at !== null;
        if (b.deleted_at) return false;
        return filter === 'all' || b.status === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#ffb76c]/20 border-t-[#ffb76c] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Booking Management</h1>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Review and assign mentors to student requests</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                    {['all', 'pending', 'awaiting_approval', 'confirmed', 'cancelled', 'deleted'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f
                                ? f === 'deleted' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-[#1B2A5A] text-white shadow-lg'
                                : 'text-gray-400 hover:text-gray-900'
                                }`}
                        >
                            {f === 'deleted' && <FaHistory size={10} />}
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredBookings.length === 0 ? (
                    <div className="bg-white p-20 rounded-[32px] border-2 border-dashed border-gray-100 text-center">
                        <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCalendarCheck size={24} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No bookings found in this category.</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => (
                        <motion.div
                            layout
                            key={booking.id}
                            className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden group hover:border-[#ffb76c]/30 transition-all duration-500"
                        >
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Left: Booking & Student Info */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    {booking.deleted_at ? (
                                                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100 flex items-center gap-1">
                                                            <FaTrash size={8} /> Recently Deleted
                                                        </span>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${booking.status === 'pending' ? 'bg-orange-50 text-orange-500 border border-orange-100' :
                                                            booking.status === 'awaiting_approval' ? 'bg-blue-50 text-blue-500 border border-blue-100' :
                                                                booking.status === 'confirmed' ? 'bg-green-50 text-green-500 border border-green-100' :
                                                                    'bg-gray-50 text-gray-500 border border-gray-100'
                                                            }`}>
                                                            {booking.status.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                        Booking ID: {booking.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                                    {booking.primary_student?.name}
                                                </h3>
                                                <p className="text-xs font-black text-[#a0522d] uppercase tracking-widest mt-1">
                                                    {booking.curriculum} • Level {booking.class_id} • {booking.class_type}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested on</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400 group-hover:text-[#a0522d] transition-colors">
                                                    <FaEnvelope size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 truncate">{booking.primary_student?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400 group-hover:text-[#a0522d] transition-colors">
                                                    <FaPhone size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">{booking.primary_student?.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50 col-span-full">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400 group-hover:text-[#a0522d] transition-colors">
                                                    <FaMapMarkerAlt size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 leading-snug">{booking.primary_student?.address}</span>
                                            </div>

                                            {/* Requested Schedule info */}
                                            {(booking.preferred_date || booking.preferred_time || booking.session_mode) && (
                                                <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#a0522d]/5 rounded-2xl border border-[#a0522d]/10">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendarAlt className="text-[#a0522d]" size={12} />
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-gray-400">Date</span>
                                                            <span className="text-[10px] font-bold text-gray-700">{booking.preferred_date || 'TBD'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FaClock className="text-[#a0522d]" size={12} />
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-gray-400">Time</span>
                                                            <span className="text-[10px] font-bold text-gray-700">{booking.preferred_time || 'TBD'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {booking.session_mode === 'online' ? <FaWifi className="text-[#a0522d]" size={12} /> : <FaHome className="text-[#a0522d]" size={12} />}
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black uppercase text-gray-400">Mode</span>
                                                            <span className="text-[10px] font-bold text-gray-700 uppercase">{booking.session_mode || 'offline'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {booking.class_type === 'group' && booking.additional_students?.length > 0 && (
                                            <div className="p-4 bg-[#1B2A5A]/5 rounded-2xl border border-[#1B2A5A]/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaUsers className="text-[#1B2A5A]" size={14} />
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Group Members</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {booking.additional_students.map((s, i) => (
                                                        <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Units & Assignment */}
                                    <div className="lg:w-80 space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Enrolled Sessions</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                {booking.selected_units.map((unit, i) => (
                                                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-white transition-all">
                                                        <p className="text-[9px] font-black text-[#a0522d] uppercase tracking-widest mb-0.5">{unit.subject_name}</p>
                                                        <p className="text-[11px] font-black text-gray-900 leading-tight">{unit.topic_name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-5 bg-gray-900 rounded-[24px] border border-white/5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#ffb76c] flex items-center justify-center text-[#1B2A5A]">
                                                    <FaChalkboardTeacher size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Mentor Unit</p>
                                                    <p className="text-[11px] font-black text-white tracking-tight mt-1">Personnel Allocation</p>
                                                </div>
                                            </div>

                                            <select
                                                value={selectedMentors[booking.id] || 'unassigned'}
                                                onChange={(e) => setSelectedMentors(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-[#ffb76c] transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={booking.status === 'confirmed'}
                                            >
                                                <option value="unassigned" className="bg-[#1F2937]">Select Mentor</option>
                                                {mentors.filter(m => isMentorAvailable(m.id, booking)).map(m => (
                                                    <option key={m.id} value={m.id} className="bg-[#1F2937] text-white">
                                                        {m.name} ({m.subject})
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="flex gap-2 pt-2">
                                                {booking.deleted_at ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestoreBooking(booking.id)}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-[#ffb76c] hover:bg-[#ffa64d] text-[#1B2A5A] rounded-xl py-3 transition-all group/btn shadow-lg shadow-[#ffb76c]/20"
                                                        >
                                                            <FaUndo size={10} className="group-hover/btn:rotate-[-45deg] transition-transform" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#1B2A5A]">Restore Booking</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBooking(booking.id, true)}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 transition-all group/btn shadow-lg shadow-red-500/20"
                                                        >
                                                            <FaTrash size={10} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Permanently Delete</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {booking.status === 'awaiting_approval' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 transition-all group/btn shadow-lg shadow-green-500/20"
                                                            >
                                                                <FaCheckCircle size={10} className="group-hover/btn:scale-110" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Confirm Assignment</span>
                                                            </button>
                                                        )}
                                                        {booking.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleAssignMentor(booking.id, selectedMentors[booking.id])}
                                                                disabled={selectedMentors[booking.id] === 'unassigned'}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-[#ffb76c] hover:bg-[#ffa64d] disabled:bg-gray-700 disabled:text-gray-500 text-[#1B2A5A] rounded-xl py-3 transition-all group/btn shadow-lg shadow-[#ffb76c]/20"
                                                            >
                                                                <FaCheckCircle size={10} className="group-hover/btn:scale-110" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Assign to Mentor</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteBooking(booking.id)}
                                                            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500 text-white/40 hover:text-white rounded-xl py-3 transition-all group/btn border border-white/10 hover:border-red-500 shadow-sm"
                                                        >
                                                            <FaTrash size={10} className="group-hover/btn:scale-110" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminBookings;
