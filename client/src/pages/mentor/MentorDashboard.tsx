import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUser, FaCheckCircle, FaTrash, FaClock, FaHistory, FaPlus,
    FaTimes, FaCalendarAlt, FaWifi, FaHome, FaLinkedin, FaGraduationCap, 
    FaBriefcase, FaStar, FaPen, FaSave, FaChevronDown, FaSignOutAlt, FaCalendarCheck, FaMapMarkerAlt
} from 'react-icons/fa';

interface MentorProfile {
    id: string;
    name: string;
    subject: string;
    description: string;
    image_url: string;
    email: string;
    contact_no: string;
    linkedin_url: string;
    qualification: string;
    work_history: string;
    rating: number;
    latitude?: number | null;
    longitude?: number | null;
    location_address?: string;
}

interface Availability {
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface Task {
    id: string;
    name: string;
    email: string;
    phone: string;
    query?: string;
    created_at: string;
    is_accepted: boolean;
    type: 'query' | 'booking';
    curriculum?: string;
    class_id?: number;
    status?: string;
    preferred_date?: string | null;
    preferred_time?: string | null;
    selected_time?: string | null;
    session_mode?: string;
}

const MentorDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<MentorProfile | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'tasks' | 'offers' | 'history'>('profile');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [visibleTasksCount, setVisibleTasksCount] = useState(5);
    const [nearbyOffers, setNearbyOffers] = useState<any[]>([]);
    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [selectedTaskForTime, setSelectedTaskForTime] = useState<Task | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [editForm, setEditForm] = useState({
        name: '',
        subject: '',
        description: '',
        linkedin_url: '',
        qualification: '',
        work_history: '',
        location_address: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    // Form states for availability
    const [newSlot, setNewSlot] = useState({
        day_of_week: 'Monday',
        start_hour: '09',
        start_min: '00',
        start_ampm: 'AM',
        end_hour: '10',
        end_min: '00',
        end_ampm: 'AM'
    });

    useEffect(() => {
        if (user?.id) {
            fetchMentorData();
        }
    }, [user?.id]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleValidateOTP = async (taskId: string, enteredOtp: string) => {
        setProcessingTaskId(taskId);
        try {
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('otp')
                .eq('id', taskId)
                .single();

            if (fetchError || !booking) throw new Error("Could not verify OTP");

            if (booking.otp === enteredOtp) {
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ 
                        status: 'completed'
                    })
                    .eq('id', taskId);

                if (updateError) throw updateError;
                
                setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
                alert("OTP Validated! Session marked as completed.");
            } else {
                alert("Invalid OTP. Please check with the parent.");
            }
        } catch (err: any) {
            console.error("OTP validation error:", err);
            alert("Error: " + err.message);
        } finally {
            setProcessingTaskId(null);
        }
    };

    const fetchMentorData = async () => {
        // Only set loading true if it's the first time we're fetching
        if (!profile) setLoading(true);
        try {
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentors')
                .select('*')
                .eq('auth_user_id', user?.id)
                .single();

            if (mentorError) throw mentorError;
            if (mentorData) {
                setProfile(mentorData);
                // Call with fresh data immediately
                fetchNearbyOffers(mentorData);
                setEditForm({
                    name: mentorData.name || '',
                    subject: mentorData.subject || '',
                    description: mentorData.description || '',
                    linkedin_url: mentorData.linkedin_url || '',
                    qualification: mentorData.qualification || '',
                    work_history: mentorData.work_history || '',
                    location_address: mentorData.location_address || '',
                    latitude: mentorData.latitude || null,
                    longitude: mentorData.longitude || null
                });

                const { data: availData } = await supabase
                    .from('mentor_availability')
                    .select('*')
                    .eq('mentor_id', mentorData.id);
                setAvailability(availData || []);

                const { data: queryData } = await supabase
                    .from('contact_queries')
                    .select('*')
                    .eq('assigned_mentor_id', mentorData.id);

                const { data: bookingData } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('assigned_mentor_id', mentorData.id);

                const formattedQueries = (queryData || []).map(q => ({ ...q, type: 'query' as const }));
                const formattedBookings = (bookingData || []).map(b => ({
                    ...b,
                    name: b.primary_student?.name,
                    email: b.primary_student?.email,
                    phone: b.primary_student?.phone,
                    type: 'booking' as const,
                    status: b.status,
                    preferred_date: b.preferred_date,
                    preferred_time: b.preferred_time,
                    session_mode: b.session_mode
                }));

                const combinedTasks = [...formattedQueries, ...formattedBookings];
                combinedTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setTasks(combinedTasks);
            }
        } catch (err) {
            console.error('Error fetching mentor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNearbyOffers = async (mentorProfile: MentorProfile) => {
        if (!mentorProfile.latitude || !mentorProfile.longitude) {
            console.log("Discovery: Mentor has no coordinates pinned.");
            return;
        }

        console.log(`Discovery Step: Scanning for bookings near ${mentorProfile.latitude}, ${mentorProfile.longitude}`);

        try {
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select('*')
                .is('assigned_mentor_id', null)
                .eq('status', 'pending');

            if (error) throw error;

            console.log(`Discovery Step: Found ${bookings?.length || 0} unassigned pending bookings in DB.`);

            const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371; // km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const nearby = (bookings || [])
                .map(b => {
                    const dist = b.latitude && b.longitude ? calculateDistance(mentorProfile.latitude!, mentorProfile.longitude!, b.latitude, b.longitude) : null;
                    if (dist !== null) {
                        console.log(`Booking ${b.id.slice(0, 5)}... is ${dist.toFixed(2)}km away (Coords: ${b.latitude}, ${b.longitude})`);
                    } else {
                        console.log(`Booking ${b.id.slice(0, 5)}... has NO coordinates.`);
                    }
                    return { ...b, distance: dist };
                })
                .filter(b => b.distance !== null && b.distance <= 20) // 20km radius
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));

            console.log(`Discovery Result: ${nearby.length} bookings within 20km.`);
            setNearbyOffers(nearby);
        } catch (err) {
            console.error('Error fetching nearby offers:', err);
        }
    };

    const handleAcceptOffer = async (bookingId: string) => {
        if (!profile) return;
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ 
                    assigned_mentor_id: profile.id,
                    status: 'awaiting_approval' // Notify admin of interest
                })
                .eq('id', bookingId);

            if (error) throw error;
            
            alert("Interest registered! Admin will review and confirm.");
            setNearbyOffers(nearbyOffers.filter(o => o.id !== bookingId));
            fetchMentorData(); // Refresh tasks
        } catch (err) {
            console.error('Error accepting offer:', err);
        }
    };

    const finalizeAcceptTask = async (taskId: string, selectedTime: string, bookingData: any) => {
        if (!profile) return;

        // 1. Stop if already confirmed (Prevents duplicate notifications)
        if (bookingData.status === 'confirmed') {
            alert("This booking is already confirmed.");
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'confirmed'} : t));
            return;
        }

        // 2. OTP Recovery: Generate if missing
        let currentOtp = bookingData.otp;
        if (!currentOtp || currentOtp === '---') {
            currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
            await supabase
                .from('bookings')
                .update({ otp: currentOtp })
                .eq('id', taskId);
        }

        // 3. Confirm Booking
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'confirmed', selected_time: selectedTime })
            .eq('id', taskId);
        
        if (error) throw error;

        // 4. Notify Parent
        const { error: notifError } = await supabase.from('notifications').insert({
            user_id: bookingData.user_id,
            title: 'Booking Confirmed!',
            message: `Great news! ${profile?.name} has been assigned as your mentor. Your session is scheduled for ${selectedTime}. Your Session OTP is: ${currentOtp}. ⚠️ Do not share this OTP at any other time except during the session.`,
            type: 'booking_confirmed'
        });

        if (notifError) {
            console.error("Notification Error:", notifError);
            alert("Task accepted, but failed to notify parent: " + notifError.message);
        } else {
            alert("Task accepted and parent notified!");
        }
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'confirmed', selected_time: selectedTime } : t));
    };

    const handleAcceptTask = async (taskId: string, type: 'query' | 'booking') => {
        if (processingTaskId) return;
        setProcessingTaskId(taskId);
        try {
            if (type === 'booking') {
                const { data: bookingData, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('id', taskId)
                    .single();

                if (fetchError || !bookingData) throw new Error("Could not fetch booking details");
                
                const times = (bookingData.preferred_time || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                
                if (times.length > 1) {
                    setSelectedTaskForTime({ ...bookingData, type: 'booking' });
                    setIsTimeModalOpen(true);
                    setProcessingTaskId(null); // Release processing state for modal
                    return;
                } else if (times.length === 1) {
                    // Auto-select if only one
                    await finalizeAcceptTask(taskId, times[0], bookingData);
                } else {
                    // No time specified? (Shouldn't happen with current logic but stay safe)
                    await finalizeAcceptTask(taskId, 'TBD', bookingData);
                }
            } else {
                const { error } = await supabase
                    .from('contact_queries')
                    .update({ is_accepted: true })
                    .eq('id', taskId);
                if (error) throw error;
                setTasks(tasks.map(t => t.id === taskId ? { ...t, is_accepted: true } : t));
            }
        } catch (err: any) {
            console.error('Error accepting task:', err);
            alert("Error: " + err.message);
        } finally {
            setProcessingTaskId(null);
        }
    };

    const handleDeclineTask = async (taskId: string, type: 'query' | 'booking') => {
        if (!window.confirm("Are you sure you want to decline this assignment?")) return;
        try {
            if (type === 'booking') {
                const { error } = await supabase
                    .from('bookings')
                    .update({ status: 'pending', assigned_mentor_id: null })
                    .eq('id', taskId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('contact_queries')
                    .update({ assigned_mentor_id: null })
                    .eq('id', taskId);
                if (error) throw error;
            }
            setTasks(tasks.filter(t => t.id !== taskId));
            alert("Task declined and returned to pool.");
        } catch (err) {
            console.error('Error declining task:', err);
        }
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('mentors')
                .update({
                    name: editForm.name,
                    subject: editForm.subject,
                    description: editForm.description,
                    linkedin_url: editForm.linkedin_url,
                    qualification: editForm.qualification,
                    work_history: editForm.work_history,
                    location_address: editForm.location_address,
                    latitude: editForm.latitude,
                    longitude: editForm.longitude
                })
                .eq('id', profile.id);

            if (error) throw error;
            setProfile({ ...profile, ...editForm });
            setIsEditModalOpen(false);
            alert("Profile updated successfully!");
        } catch (err: any) {
            console.error("Update error:", err);
            alert("Failed to update profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const handleAddAvailability = async () => {
        if (!profile) return;
        try {
            // Convert to 24h format for DB
            const convertTo24h = (h: string, m: string, ampm: string) => {
                let hour = parseInt(h);
                if (ampm === 'PM' && hour < 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                return `${hour.toString().padStart(2, '0')}:${m}:00`;
            };

            const startTime = convertTo24h(newSlot.start_hour, newSlot.start_min, newSlot.start_ampm);
            const endTime = convertTo24h(newSlot.end_hour, newSlot.end_min, newSlot.end_ampm);

            const { data, error } = await supabase
                .from('mentor_availability')
                .insert([{ 
                    day_of_week: newSlot.day_of_week,
                    start_time: startTime,
                    end_time: endTime,
                    mentor_id: profile.id 
                }])
                .select();
            
            if (error) {
                console.error('Error adding availability:', error);
                alert(`Failed to add availability: ${error.message}`);
                return;
            }
            
            if (data && data.length > 0) {
                setAvailability([...availability, data[0]]);
                alert("Availability window added!");
            }
        } catch (err) {
            console.error('Error adding availability:', err);
        }
    };

    const handleDeleteAvailability = async (id: string) => {
        try {
            const { error } = await supabase
                .from('mentor_availability')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setAvailability(availability.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting availability:', err);
        }
    };

    const formatTime12h = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${m} ${ampm}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-['Urbanist']">
            <div className="w-16 h-16 border-4 border-[#1B2A5A]/20 border-t-[#1B2A5A] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-['Urbanist'] pt-24">
            {/* Home-style Header */}
            <header className="fixed w-full top-0 z-50 bg-white shadow-md border-b border-gray-100">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link to="/" className="flex items-center space-x-0">
                        <img src="/logo.png" alt="Our Home Tuition Logo" className="w-16 h-16 object-contain -my-3" />
                        <div className="ml-2">
                            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Mentor<span className="text-[#a0522d]">Portal</span></h1>
                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Faculty System</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="h-10 flex items-center gap-3 bg-[#1B2A5A] text-white px-2 pr-4 rounded-full hover:bg-[#142044] transition-all border border-white/10 shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-white/50 flex-shrink-0">
                                    <img src={profile?.image_url} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col items-start pr-2">
                                    <span className="text-xs font-bold text-white line-clamp-1">{profile?.name.split(' ')[0]}</span>
                                    <span className="text-[10px] text-[#22c55e] font-bold leading-none mt-0.5 uppercase tracking-tighter">Mentor</span>
                                </div>
                                <FaChevronDown size={10} className={`text-white/80 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[100] origin-top-right"
                                    >
                                        <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                                            <p className="text-sm font-black text-gray-800 truncate">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-gray-600 hover:text-[#a0522d] hover:bg-orange-50 transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center"><FaUser size={14} /></div>
                                            Profile Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all border-t border-gray-50 mt-2"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><FaSignOutAlt size={14} /></div>
                                            Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-3 space-y-2">
                        {[
                            { id: 'profile', icon: <FaUser />, label: 'My Profile' },
                            { id: 'availability', icon: <FaCalendarCheck />, label: 'Availability' },
                            { id: 'offers', icon: <FaMapMarkerAlt />, label: 'Nearby Offers' },
                            { id: 'tasks', icon: <FaClock />, label: 'Current Tasks' },
                            { id: 'history', icon: <FaHistory />, label: 'Booking History' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-[#1B2A5A] text-white shadow-xl shadow-[#1B2A5A]/20'
                                    : 'bg-white text-gray-400 hover:text-gray-900 hover:shadow-md'
                                    }`}
                            >
                                <span className="text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="absolute top-6 right-6 w-10 h-10 bg-gray-50 text-gray-400 hover:text-[#a0522d] hover:bg-orange-50 rounded-xl flex items-center justify-center transition-all shadow-sm border border-gray-100"
                                            title="Edit Profile"
                                        >
                                            <FaPen size={14} />
                                        </button>

                                        <div className="relative group">
                                            <img src={profile?.image_url} alt={profile?.name} className="w-40 h-40 rounded-3xl object-cover border-4 border-white shadow-2xl" />
                                        </div>
                                        <div className="flex-1 space-y-4 pt-4 md:pt-0">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.name}</h2>
                                                    <div className="flex bg-yellow-400 text-white px-3 py-1 rounded-full items-center gap-1.5 shadow-sm shadow-yellow-400/20">
                                                        <FaStar size={10} />
                                                        <span className="text-xs font-black">{profile?.rating || '0.0'}</span>
                                                    </div>
                                                </div>
                                                <p className="text-lg font-bold text-[#a0522d]">{profile?.subject} Specialist</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FaUser size={12} /></div>
                                                    <span className="text-xs font-bold">{profile?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center"><FaLinkedin size={12} /></div>
                                                    <a href={profile?.linkedin_url} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline">LinkedIn Profile</a>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><FaGraduationCap size={12} /></div>
                                                    <span className="text-xs font-bold">{profile?.qualification}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><FaBriefcase size={12} /></div>
                                                    <span className="text-xs font-bold">Work History verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] mb-4">Professional Bio</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                                                {profile?.description}
                                            </p>
                                        </div>
                                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] mb-4">Work Experience</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                                                {profile?.work_history}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'availability' && (
                                <motion.div
                                    key="availability"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50"
                                >
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Time Management</h2>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Set your daily active windows</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-6 mb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                                            {/* Day Selection */}
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Day of Week</label>
                                                <select
                                                    value={newSlot.day_of_week}
                                                    onChange={e => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none"
                                                >
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <option key={day} value={day}>{day}</option>)}
                                                </select>
                                            </div>

                                            {/* Start Time */}
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Start Time</label>
                                                <div className="flex gap-1">
                                                    <select 
                                                        value={newSlot.start_hour}
                                                        onChange={e => setNewSlot({...newSlot, start_hour: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.start_min}
                                                        onChange={e => setNewSlot({...newSlot, start_min: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.start_ampm}
                                                        onChange={e => setNewSlot({...newSlot, start_ampm: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-[#1B2A5A] text-white border-none rounded-xl outline-none text-[10px] font-black focus:ring-2 focus:ring-[#a0522d] appearance-none text-center cursor-pointer"
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex items-center justify-center pb-4 text-gray-300">
                                                <div className="w-4 h-0.5 bg-gray-200 rounded-full"></div>
                                            </div>

                                            {/* End Time */}
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">End Time</label>
                                                <div className="flex gap-1">
                                                    <select 
                                                        value={newSlot.end_hour}
                                                        onChange={e => setNewSlot({...newSlot, end_hour: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.end_min}
                                                        onChange={e => setNewSlot({...newSlot, end_min: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.end_ampm}
                                                        onChange={e => setNewSlot({...newSlot, end_ampm: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-[#1B2A5A] text-white border-none rounded-xl outline-none text-[10px] font-black focus:ring-2 focus:ring-[#a0522d] appearance-none text-center cursor-pointer"
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAddAvailability}
                                            className="w-full bg-[#1B2A5A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#142044] transition-all flex items-center justify-center gap-3 py-4 shadow-xl shadow-[#1B2A5A]/10"
                                        >
                                            <FaPlus size={10} /> Add Time Window
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availability.map(slot => (
                                            <div key={slot.id} className="p-5 bg-white border-2 border-gray-50 rounded-3xl hover:border-[#a0522d]/20 transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] bg-orange-50 px-3 py-1 rounded-full">{slot.day_of_week}</span>
                                                    <button onClick={() => handleDeleteAvailability(slot.id)} className="text-gray-300 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-900">
                                                    <FaClock size={12} className="text-gray-400" />
                                                    <span className="text-sm font-black tracking-tight">{formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'offers' && (
                                <motion.div
                                    key="offers"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nearby Opportunities</h2>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Bookings within 20km of your location</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => profile && fetchNearbyOffers(profile)}
                                                    className="p-2 text-gray-400 hover:text-[#a0522d] transition-colors"
                                                    title="Refresh Offers"
                                                >
                                                    <div className={loading ? 'animate-spin' : ''}><FaHistory size={14} /></div>
                                                </button>
                                                <div className="px-4 py-2 bg-orange-50 text-[#a0522d] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <FaMapMarkerAlt size={12} /> {profile?.location_address?.split(',')[0] || 'Location Set'}
                                                </div>
                                            </div>
                                        </div>

                                        {!profile?.latitude ? (
                                            <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                                <FaMapMarkerAlt size={32} className="text-gray-200 mx-auto mb-4" />
                                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">Location Not Set</h4>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest max-w-xs mx-auto leading-loose mb-6">
                                                    Please pin your location in "My Profile" to discover student bookings in your neighborhood.
                                                </p>
                                                <button onClick={() => setActiveTab('profile')} className="px-8 py-3 bg-[#1B2A5A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142044] transition-all">
                                                    Go to Profile
                                                </button>
                                            </div>
                                        ) : nearbyOffers.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                                <FaClock size={32} className="text-gray-200 mx-auto mb-4" />
                                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">No Nearby Bookings</h4>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest max-w-xs mx-auto leading-loose">
                                                    We couldn't find any pending bookings within 20km right now. Check back later!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {nearbyOffers.map(offer => (
                                                    <div key={offer.id} className="bg-white p-6 rounded-[32px] border-2 border-gray-50 hover:border-orange-100 transition-all flex flex-col md:flex-row justify-between items-center gap-6">
                                                        <div className="flex-1 space-y-3 shrink-0">
                                                            <div className="flex items-center gap-3">
                                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                                    {offer.curriculum}
                                                                </span>
                                                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                                                    <FaMapMarkerAlt size={10} /> {offer.distance?.toFixed(1)} km away
                                                                </span>
                                                            </div>
                                                            <h4 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                                                                New Booking Request
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold max-w-md truncate">
                                                                {offer.primary_student?.address || 'Address hidden for privacy'}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                    <FaCalendarAlt size={10} className="text-[#a0522d]" />
                                                                    <span className="text-[10px] font-bold text-gray-600">{offer.preferred_date || 'TBD'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                    <FaClock size={10} className="text-[#a0522d]" />
                                                                    <span className="text-[10px] font-bold text-gray-600">{offer.preferred_time || 'TBD'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAcceptOffer(offer.id)}
                                                            disabled={processingTaskId === offer.id}
                                                            className="w-full md:w-auto px-8 py-4 bg-[#1B2A5A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {processingTaskId === offer.id ? (
                                                                <span className="flex items-center gap-2">
                                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    Processing...
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <FaCheckCircle size={12} /> Show Interest
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'tasks' && (
                                <motion.div
                                    key="tasks"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Assignments</h2>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full border border-blue-100">{tasks.filter(t => t.status === 'awaiting_approval' || !t.is_accepted).length} New Requests</span>
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100">
                                            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaClock size={24} />
                                            </div>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active tasks assigned.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {tasks.slice(0, visibleTasksCount).map(task => (
                                                <div key={task.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-black text-gray-900">{task.name}</h3>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${task.type === 'booking' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {task.type === 'booking' ? 'Session Booking' : 'General Query'}
                                                            </span>
                                                        </div>
                                                        {task.query ? (
                                                            <p className="text-xs text-gray-500 font-medium italic mb-4">"{task.query}"</p>
                                                        ) : (
                                                            <p className="text-xs text-[#a0522d] font-black uppercase tracking-widest mb-4">
                                                                {task.curriculum} • Level {task.class_id}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-4">
                                                            <span className="text-[10px] font-bold text-gray-400">Email: {task.email}</span>
                                                            <span className="text-[10px] font-bold text-gray-400">Phone: {task.phone}</span>
                                                            {task.type === 'booking' && (
                                                                <>
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                        <FaCalendarAlt size={10} className="text-[#a0522d]" />
                                                                        <span className="text-[10px] font-bold text-gray-600">{task.preferred_date || 'TBD'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                        <FaClock size={10} className="text-[#a0522d]" />
                                                                        <span className="text-[10px] font-bold text-gray-600">{task.preferred_time || 'TBD'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                        {task.session_mode === 'online' ? <FaWifi size={10} className="text-[#a0522d]" /> : <FaHome size={10} className="text-[#a0522d]" />}
                                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">{task.session_mode || 'offline'}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {(task.type === 'query' && !task.is_accepted) || (task.type === 'booking' && task.status === 'awaiting_approval') ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptTask(task.id, task.type)}
                                                                    disabled={processingTaskId === task.id}
                                                                    className="px-6 py-3 bg-[#1B2A5A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142044] transition-all shadow-lg shadow-[#1B2A5A]/10 flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {processingTaskId === task.id ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                            Processing...
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            <FaCheckCircle size={12} /> Accept Task
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeclineTask(task.id, task.type)}
                                                                    className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                                                    title="Decline / Pass Task"
                                                                >
                                                                    <FaTrash size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-end gap-3">
                                                                <div className="flex items-center gap-2 text-green-500 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                                                                    <FaCheckCircle size={12} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">{task.status === 'completed' ? 'Session Completed' : 'Active & Confirmed'}</span>
                                                                </div>
                                                                
                                                                {task.type === 'booking' && task.status === 'confirmed' && (
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Enter Session OTP"
                                                                            maxLength={6}
                                                                            className="w-32 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#a0522d] transition-all"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    handleValidateOTP(task.id, (e.target as HTMLInputElement).value);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                                handleValidateOTP(task.id, input.value);
                                                                            }}
                                                                            className="px-4 py-2 bg-[#a0522d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#804224] transition-all"
                                                                        >
                                                                            Validate
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {tasks.length > visibleTasksCount && (
                                                <div className="flex justify-center pt-8">
                                                    <button
                                                        onClick={() => setVisibleTasksCount(prev => prev + 5)}
                                                        className="group flex items-center gap-2 text-[#a0522d] hover:text-[#c75e33] font-black text-[10px] uppercase tracking-widest transition-all"
                                                    >
                                                        <FaChevronDown className="group-hover:translate-y-1 transition-transform" />
                                                        Show More Tasks
                                                        <span className="text-gray-400 font-bold ml-1">
                                                            ({tasks.length - visibleTasksCount})
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Session History</h2>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-4 py-1.5 rounded-full border border-green-100">
                                            {tasks.filter(t => t.status === 'completed').length} Completed
                                        </span>
                                    </div>

                                    {tasks.filter(t => t.status === 'completed').length === 0 ? (
                                        <div className="bg-white p-20 rounded-[40px] shadow-sm border border-gray-100 text-center">
                                            <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <FaHistory size={32} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Booking Lifecycle</h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest max-w-xs mx-auto leading-loose">
                                                Your completed sessions and student feedback history will appear here once sessions are finalized.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {tasks.filter(t => t.status === 'completed').map(task => (
                                                <div key={task.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-black text-gray-900">{task.name}</h3>
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-green-50 text-green-600">
                                                                Completed
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[#a0522d] font-black uppercase tracking-widest mb-4">
                                                            {task.curriculum} • Level {task.class_id}
                                                        </p>
                                                        <div className="flex flex-wrap gap-4">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                <FaCalendarAlt size={10} className="text-[#a0522d]" />
                                                                <span className="text-[10px] font-bold text-gray-600">{task.preferred_date}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                <FaClock size={10} className="text-[#a0522d]" />
                                                                <span className="text-[10px] font-bold text-gray-600">{task.selected_time || task.preferred_time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 text-right">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance Status</span>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100">
                                                            <FaCheckCircle size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">OTP Verified</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-none">Edit Profile</h2>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 px-1 border-l-2 border-[#a0522d]">Faculty Records</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-all">
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Subject Expertise</label>
                                        <input
                                            type="text"
                                            value={editForm.subject}
                                            onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">LinkedIn Profile</label>
                                        <input
                                            type="text"
                                            value={editForm.linkedin_url}
                                            onChange={e => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Qualification</label>
                                        <input
                                            type="text"
                                            value={editForm.qualification}
                                            onChange={e => setEditForm({ ...editForm, qualification: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Professional Bio</label>
                                    <textarea
                                        rows={4}
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] ml-1">Work Experience</label>
                                    <textarea
                                        rows={4}
                                        value={editForm.work_history}
                                        onChange={e => setEditForm({ ...editForm, work_history: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm resize-none"
                                    />
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] flex items-center gap-3">
                                        <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Service Location
                                    </h3>
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Base Address / Primary Area</label>
                                            <input
                                                type="text"
                                                value={editForm.location_address}
                                                onChange={e => setEditForm({ ...editForm, location_address: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                                placeholder="e.g. Jubilee Hills, Hyderabad"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!navigator.geolocation) {
                                                    alert("Geolocation is not supported");
                                                    return;
                                                }
                                                setEditForm(prev => ({ ...prev, location_address: 'Detecting...' }));
                                                navigator.geolocation.getCurrentPosition(async (pos) => {
                                                    const { latitude, longitude } = pos.coords;
                                                    try {
                                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                        const data = await res.json();
                                                        setEditForm(prev => ({
                                                            ...prev,
                                                            latitude,
                                                            longitude,
                                                            location_address: data.display_name || `${latitude}, ${longitude}`
                                                        }));
                                                    } catch (e) {
                                                        setEditForm(prev => ({ ...prev, latitude, longitude, location_address: `${latitude}, ${longitude}` }));
                                                    }
                                                }, () => {
                                                    alert("Location access denied");
                                                    setEditForm(prev => ({ ...prev, location_address: profile?.location_address || '' }));
                                                });
                                            }}
                                            className="px-6 py-4 bg-orange-50 text-[#a0522d] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2 mb-0.5"
                                        >
                                            <FaMapMarkerAlt size={12} /> Pin Location
                                        </button>
                                    </div>
                                    {(editForm.latitude && editForm.longitude) && (
                                        <p className="text-[9px] font-bold text-green-500 ml-1 flex items-center gap-1">
                                            <FaCheckCircle size={8} /> Coordinates Saved: {editForm.latitude.toFixed(4)}, {editForm.longitude.toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-[#1B2A5A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FaSave /> Commit Changes</>}
                                </button>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-8 py-4 border-2 border-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Discard
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Time Selection Modal */}
            <AnimatePresence>
                {isTimeModalOpen && selectedTaskForTime && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-orange-50 text-[#a0522d] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaClock size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-none">Select Session Time</h2>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 px-1">Multiple slots requested</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                {(selectedTaskForTime.preferred_time || '').split(',').map((time, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedTime(time.trim())}
                                        className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                                            selectedTime === time.trim() 
                                            ? 'border-[#a0522d] bg-orange-50/50' 
                                            : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                                        }`}
                                    >
                                        <span className={`font-bold ${selectedTime === time.trim() ? 'text-[#a0522d]' : 'text-gray-600'}`}>
                                            {time.trim()}
                                        </span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            selectedTime === time.trim() ? 'border-[#a0522d] bg-[#a0522d]' : 'border-gray-200'
                                        }`}>
                                            {selectedTime === time.trim() && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    disabled={!selectedTime || processingTaskId === selectedTaskForTime.id}
                                    onClick={async () => {
                                        if (!selectedTime) return;
                                        setProcessingTaskId(selectedTaskForTime.id);
                                        try {
                                            await finalizeAcceptTask(selectedTaskForTime.id, selectedTime, selectedTaskForTime);
                                            setIsTimeModalOpen(false);
                                            setSelectedTaskForTime(null);
                                            setSelectedTime('');
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            setProcessingTaskId(null);
                                        }
                                    }}
                                    className="flex-1 py-4 bg-[#1B2A5A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20 disabled:opacity-50"
                                >
                                    {processingTaskId === selectedTaskForTime.id ? "Processing..." : "Confirm Schedule"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsTimeModalOpen(false);
                                        setSelectedTaskForTime(null);
                                        setSelectedTime('');
                                    }}
                                    className="px-6 py-4 border-2 border-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MentorDashboard;
