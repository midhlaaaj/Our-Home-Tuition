"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
    FaArrowLeft, FaCalendarAlt, FaClock, FaUser, FaCheckCircle, 
    FaGraduationCap, FaInfoCircle, FaMapMarkerAlt, FaWifi, FaHome,
    FaClipboardList, FaExclamationTriangle
} from 'react-icons/fa';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingDetailsProps {
    id: string;
}

const ALL_TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
];

const BookingDetails: React.FC<BookingDetailsProps> = ({ id }) => {
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert, showSuccess } = useModal();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, mentor:mentors(id, name)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setBooking(data);
            setNewDate(data.preferred_date || '');
            setNewTime(data.preferred_time || '');
        } catch (err: any) {
            console.error("Error fetching booking:", err);
            showAlert("Failed to load booking details.");
        } finally {
            setLoading(false);
        }
    };

    const isWithinSixHours = () => {
        if (!booking?.preferred_date || !booking?.preferred_time) return false;

        // Parse date and time in IST (standardized as UTC+5.5)
        const [hourStr, minuteStr, period] = booking.preferred_time.match(/(\d+):(\d+)\s+(AM|PM)/i)?.slice(1) || [];
        let hours = parseInt(hourStr);
        if (period?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;

        const sessionDate = new Date(booking.preferred_date);
        sessionDate.setHours(hours, parseInt(minuteStr), 0, 0);

        const now = new Date();
        const diffInMs = sessionDate.getTime() - now.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        return diffInHours < 6;
    };

    const handleReschedule = async () => {
        if (booking?.is_rescheduled) {
            showAlert("This session has already been rescheduled once. Contact support for further changes.");
            return;
        }

        if (isWithinSixHours()) {
            showAlert("Rescheduling is only allowed at least 6 hours before the session starts.");
            return;
        }

        if (!newDate || !newTime) {
            showAlert("Please select a valid date and time.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({
                    preferred_date: newDate,
                    preferred_time: newTime,
                    is_rescheduled: true,
                    last_rescheduled_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Notify Mentor if assigned
            if (booking.assigned_mentor_id) {
                await supabase.from('mentor_notifications').insert({
                    mentor_id: booking.assigned_mentor_id,
                    booking_id: id,
                    title: 'Session Rescheduled',
                    message: `Booking for Class ${booking.class_id} has been rescheduled to ${newDate} at ${newTime} by the parent.`
                });
            }

            showSuccess("Session rescheduled successfully!");
            setIsRescheduling(false);
            fetchBooking();
        } catch (err: any) {
            console.error("Reschedule error:", err);
            showAlert("Failed to reschedule: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAvailableSlots = () => {
        const today = new Date();
        const localTodayStr = today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
            
        if (newDate !== localTodayStr) return ALL_TIME_SLOTS;

        const currentHour = today.getHours();
        return ALL_TIME_SLOTS.filter(slot => {
            const [time, period] = slot.split(' ');
            let [h] = time.split(':').map(Number);
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            return h >= currentHour + 2; // Keep the same 2h buffer logic for consistency
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-[64px]">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#1B2A5A]/30 border-t-[#1B2A5A] rounded-full animate-spin"></div>
                <p className="mt-4 font-bold text-gray-500">Loading session details...</p>
            </div>
            <Footer />
        </div>
    );

    if (!booking) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-[64px]">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <FaExclamationTriangle size={48} className="text-orange-400 mb-4" />
                <h2 className="text-2xl font-black text-gray-900">Booking not found</h2>
                <button onClick={() => router.push('/profile')} className="mt-6 text-[#1B2A5A] font-bold underline">Back to Profile</button>
            </div>
            <Footer />
        </div>
    );

    const mentorName = Array.isArray(booking.mentor) ? booking.mentor[0]?.name : booking.mentor?.name;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pt-[64px]">
            <Header />

            <main className="flex-grow container mx-auto px-6 py-12 max-w-5xl">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center gap-3 text-gray-400 hover:text-[#a0522d] transition-all group"
                    >
                        <div className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center group-hover:translate-x-[-4px] transition-transform">
                            <FaArrowLeft size={14} />
                        </div>
                        <span className="text-sm font-black text-[#1B2A5A] uppercase tracking-widest">Back to Profile</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                            booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' :
                            booking.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                            'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                            {booking.status}
                        </span>
                        {booking.is_rescheduled && (
                            <span className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                Rescheduled
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Details Column */}
                    <div className="lg:col-span-12 space-y-8">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 lg:p-12"
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-12">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-[#ffb76c] text-[#1B2A5A] rounded-[24px] flex items-center justify-center shadow-lg shadow-orange-200/50 mb-6">
                                        <FaGraduationCap size={32} />
                                    </div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                                        Class {booking.class_id}
                                    </h1>
                                    <p className="text-sm font-black text-[#a0522d] uppercase tracking-[0.3em]">{booking.curriculum} Curriculum</p>
                                </div>

                                <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex-1 md:max-w-xs">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#1B2A5A]">
                                                <FaCalendarAlt size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Session Date</p>
                                                <p className="text-sm font-black text-gray-900">{booking.preferred_date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#1B2A5A]">
                                                <FaClock size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Start Time</p>
                                                <p className="text-sm font-black text-gray-900">{booking.preferred_time}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                                {/* Mode & Type */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] mb-4">Format Details</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                                            {booking.session_mode === 'online' ? <FaWifi className="text-blue-500" /> : <FaHome className="text-orange-500" />}
                                            <span className="text-sm font-bold text-gray-700 capitalize">{booking.session_mode} Session</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                                            <FaUser className="text-purple-500" />
                                            <span className="text-sm font-bold text-gray-700 capitalize">{booking.class_type} Format</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mentor Status */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] mb-4">Assigned Mentor</h3>
                                    <div className="flex items-center gap-4 bg-gray-900 p-5 rounded-[24px] shadow-xl">
                                        <div className="w-10 h-10 bg-white/10 text-[#ffb76c] rounded-xl flex items-center justify-center">
                                            <FaUser size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">Qualified Tutor</p>
                                            <p className="text-sm font-black text-white">{mentorName || 'Allocation in progress'}</p>
                                        </div>
                                        {booking.status === 'confirmed' && (
                                            <div className="ml-auto w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                                                <FaCheckCircle size={14} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Syllabus Summary */}
                            <div className="mt-12 space-y-6">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] mb-6 flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Syllabus Coverage
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {booking.selected_units?.map((unit: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50/50 border border-gray-100 p-6 rounded-[28px] hover:bg-white hover:shadow-lg transition-all group">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 group-hover:text-[#a0522d] transition-colors">{unit.subject_name}</p>
                                            <p className="text-sm font-black text-gray-800 leading-relaxed">{unit.topic_name}</p>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-white bg-[#1B2A5A] px-2 py-0.5 rounded-md">UNIT {unit.unit_no || (idx + 1)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-gray-100">
                                {booking?.is_rescheduled ? (
                                    <div className="bg-gray-50 border border-gray-200 p-8 rounded-[32px] flex items-center justify-center gap-4">
                                        <FaInfoCircle className="text-gray-400" size={20} />
                                        <p className="text-sm font-black text-gray-500 uppercase tracking-widest text-center">
                                            This session has already been rescheduled once. No further changes allowed.
                                        </p>
                                    </div>
                                ) : !isRescheduling ? (
                                    <button 
                                        onClick={() => setIsRescheduling(true)}
                                        className="w-full bg-[#1B2A5A] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-[#1B2A5A]/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                                    >
                                        <FaCalendarAlt /> Reschedule This Session
                                    </button>
                                ) : (
                                    <div className="bg-orange-50/30 border border-orange-100 p-8 lg:p-12 rounded-[40px] animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex justify-between items-center mb-10">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Modify Schedule</h3>
                                                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1 italic">Note: Mentor will be notified of these changes</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsRescheduling(false)}
                                                className="text-gray-400 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Date Picker */}
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black text-[#1B2A5A] uppercase tracking-widest ml-1">New Date</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#a0522d] transition-colors">
                                                        <FaCalendarAlt size={14} />
                                                    </div>
                                                    <input 
                                                        type="date"
                                                        value={newDate}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => {
                                                            setNewDate(e.target.value);
                                                            setNewTime(''); // Reset time on date change
                                                        }}
                                                        className="w-full pl-12 pr-6 py-4 bg-white border-2 border-transparent focus:border-[#a0522d] rounded-2xl font-black text-sm outline-none shadow-sm transition-all shadow-gray-100"
                                                    />
                                                </div>
                                            </div>

                                            {/* Time Selector */}
                                            <div className="space-y-4">
                                                <label className="text-[11px] font-black text-[#1B2A5A] uppercase tracking-widest ml-1">New Time Slot</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {getAvailableSlots().map((time) => {
                                                        const isSelected = newTime === time;
                                                        return (
                                                            <button
                                                                key={time}
                                                                type="button"
                                                                onClick={() => setNewTime(isSelected ? '' : time)}
                                                                className={`py-3 rounded-xl text-[9px] font-black transition-all border-2 flex flex-col items-center justify-center ${isSelected
                                                                    ? 'bg-[#a0522d] border-[#a0522d] text-white shadow-lg'
                                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-orange-100 hover:text-[#a0522d]'
                                                                    }`}
                                                            >
                                                                <span className="text-[10px]">{time.split(' ')[0]}</span>
                                                                <span className="text-[7.5px] uppercase opacity-60">{time.split(' ')[1]}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 p-6 bg-white rounded-3xl border border-orange-100 shadow-sm flex items-start gap-4 mb-8">
                                            <div className="w-10 h-10 bg-orange-100 text-[#a0522d] rounded-xl flex items-center justify-center shrink-0">
                                                <FaInfoCircle size={18} />
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed pt-1">
                                                By confirming, you acknowledge that rescheduling is only permitted at least **6 hours** before the current session. The assigned mentor will receive an instant notification about this change.
                                            </p>
                                        </div>

                                        <button 
                                            disabled={isSubmitting}
                                            onClick={handleReschedule}
                                            className="w-full bg-[#1B2A5A] text-white py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-[#1B2A5A]/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-4"
                                        >
                                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Update & Notify Mentor <FaCheckCircle /></>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BookingDetails;
