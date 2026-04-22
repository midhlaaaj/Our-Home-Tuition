"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
    FaUser, FaEnvelope, FaMapMarkerAlt, FaUsers,
    FaArrowLeft, FaCheckCircle, FaTrash, FaClipboardList, FaGraduationCap,
    FaCalendarAlt, FaClock, FaWifi, FaHome, FaInfoCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../context/ModalContext';
import { useCurriculum } from '../context/CurriculumContext';

interface LocationState {
    selectedUnits: { subject: any, topic: any }[];
    classInfo: any;
    curriculum: string;
}

const ALL_TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
];

declare global {
    interface Window {
        Razorpay: any;
    }
}

const BookingPage: React.FC = () => {
    const router = useRouter();
    const { showAlert } = useModal();
    const { bookingData: state } = useCurriculum();

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [classType, setClassType] = useState<'individual' | 'group'>('individual');
    const [additionalStudents, setAdditionalStudents] = useState<{ id: string, name: string, email: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('');
    const [sessionMode, setSessionMode] = useState<'online' | 'offline'>('offline');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const { user } = useAuth();

    // Calculate available time slots
    const getAvailableSlots = () => {
        if (!preferredDate) return ALL_TIME_SLOTS;

        const today = new Date();
        
        // Compare dates without time using local date
        const localDate = today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
            
        const isToday = localDate === preferredDate;
        
        if (!isToday) return ALL_TIME_SLOTS;

        const currentHour = today.getHours();
        
        return ALL_TIME_SLOTS.filter(slot => {
            const [time, period] = slot.split(' ');
            let [slotHour] = time.split(':').map(Number);
            
            // Convert to 24-hour format for comparison
            if (period === 'PM' && slotHour !== 12) slotHour += 12;
            if (period === 'AM' && slotHour === 12) slotHour = 0;
            
            // Apply 2-hour buffer rule
            return slotHour >= currentHour + 2;
        });
    };

    const availableSlots = getAvailableSlots();

    // Reset preferred time if it's no longer available
    useEffect(() => {
        if (preferredTime && !availableSlots.includes(preferredTime)) {
            setPreferredTime('');
        }
    }, [preferredDate, availableSlots, preferredTime]);

    // Pre-fill user data
    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || localStorage.getItem('booking_name') || '');
            setEmail(user.email || localStorage.getItem('booking_email') || '');
            setPhone(user.user_metadata?.phone || localStorage.getItem('booking_phone') || '');
            setAddress(user.user_metadata?.address || localStorage.getItem('booking_address') || '');
        } else {
            setName(localStorage.getItem('booking_name') || '');
            setEmail(localStorage.getItem('booking_email') || '');
            setPhone(localStorage.getItem('booking_phone') || '');
            setAddress(localStorage.getItem('booking_address') || '');
        }
    }, [user]);

    // Save to localStorage when changed
    useEffect(() => {
        if (name) localStorage.setItem('booking_name', name);
        if (email) localStorage.setItem('booking_email', email);
        if (phone) localStorage.setItem('booking_phone', phone);
        if (address) localStorage.setItem('booking_address', address);
    }, [name, email, phone, address]);

    const handleAddStudent = () => {
        const maxTotalStudents = 5;
        
        if (additionalStudents.length + 1 >= maxTotalStudents) {
            showAlert(`Maximum ${maxTotalStudents} students allowed for ${state?.classInfo?.label}.`);
            return;
        }
        setAdditionalStudents([...additionalStudents, { id: Date.now().toString(), name: '', email: '' }]);
    };

    const handleRemoveStudent = (id: string) => {
        setAdditionalStudents(additionalStudents.filter(s => s.id !== id));
    };

    const handleStudentChange = (id: string, field: 'name' | 'email', value: string) => {
        setAdditionalStudents(additionalStudents.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    
    const getBasePrice = () => {
        const studentCount = additionalStudents.length + 1;
        const offlinePricing = [499, 699, 899, 1099, 1299];
        const onlinePricing = [399, 599, 699, 799, 999];
        
        const priceList = sessionMode === 'offline' ? offlinePricing : onlinePricing;
        // Pricing is for the 2h base block for all classes
        return priceList[Math.min(studentCount, 5) - 1] || 0;
    };

    const basePrice = getBasePrice();
    const charges = Math.round(basePrice * 0.23);
    const totalPrice = basePrice + charges;
    const totalDuration = state?.selectedUnits?.reduce((acc, curr) => acc + (curr.topic.estimated_duration || 60), 0) || 0;

    const handleRazorpayPayment = async () => {
        return new Promise((resolve, reject) => {
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
                amount: totalPrice * 100, // Amount in paise
                currency: "INR",
                name: "Hour Home",
                description: `Booking for ${state?.classInfo?.label}`,
                image: "/newlogo.png",
                handler: function (response: any) {
                    resolve(response);
                },
                prefill: {
                    name,
                    email,
                    contact: phone
                },
                theme: {
                    color: "#1B2A5A"
                },
                modal: {
                    ondismiss: function () {
                        reject(new Error("Payment cancelled by user"));
                    }
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            showAlert("Please sign in to book a session.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Initiate Razorpay Payment - BYPASSED FOR TESTING
            // const paymentResponse: any = await handleRazorpayPayment();
            const paymentResponse = {
                razorpay_payment_id: 'test_bypass_' + Math.random().toString(36).substring(7),
                razorpay_order_id: 'order_bypass_' + Math.random().toString(36).substring(7)
            };

            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            const { error } = await supabase
                .from('bookings')
                .insert({
                    user_id: user.id,
                    class_id: state?.classInfo.id,
                    curriculum: state?.curriculum,
                    selected_units: state?.selectedUnits.map(su => ({
                        subject_id: su.subject.id,
                        topic_id: su.topic.id,
                        unit_no: su.topic.unit_no,
                        subject_name: su.subject.name,
                        topic_name: su.topic.name,
                        price: su.topic.unit_price || 100
                    })),
                    primary_student: { name, email, phone, address },
                    class_type: classType,
                    additional_students: classType === 'group' ? additionalStudents : [],
                    preferred_date: preferredDate || null,
                    preferred_time: preferredTime || null,
                    session_mode: sessionMode,
                    latitude: lat,
                    longitude: lng,
                    status: 'pending',
                    otp: otp,
                    paid_amount: totalPrice,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id
                });

            if (error) throw error;

            // Send Notification to Parent
            const { error: notifError } = await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'Booking Request',
                message: 'Your booking request has been initiated. our team will contact you soon.',
                type: 'booking_initiated'
            });

            if (notifError) {
                console.error("Notification Error:", notifError);
            }

            // === Notify nearby available mentors ===
            if (lat && lng) {
                try {
                    // 1. Fetch all mentors with geo coords
                    const { data: allMentors } = await supabase
                        .from('mentors')
                        .select('id, name, latitude, longitude')
                        .not('latitude', 'is', null)
                        .not('longitude', 'is', null);

                    const haversine = (la1: number, lo1: number, la2: number, lo2: number) => {
                        const R = 6371;
                        const dLat = (la2 - la1) * Math.PI / 180;
                        const dLon = (lo2 - lo1) * Math.PI / 180;
                        const a = Math.sin(dLat / 2) ** 2 +
                            Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    };

                    const nearbyMentors = (allMentors || []).filter((m: any) =>
                        haversine(lat, lng, m.latitude, m.longitude) <= 20
                    );

                    const mentorFare = Math.round(basePrice * 0.8);

                    for (const mentor of nearbyMentors) {
                        // 2. Check for scheduling conflict
                        const { data: conflicts } = await supabase
                            .from('bookings')
                            .select('id')
                            .eq('assigned_mentor_id', mentor.id)
                            .eq('preferred_date', preferredDate)
                            .ilike('preferred_time', `%${preferredTime}%`)
                            .not('status', 'eq', 'cancelled');

                        if (conflicts && conflicts.length > 0) continue; // Skip busy mentor

                        // 3. Insert mentor notification
                        await supabase.from('mentor_notifications').insert({
                            mentor_id: mentor.id,
                            booking_id: null, // will be linked via booking lookup
                            title: 'New Session Nearby',
                            message: `A new 2-hour ${sessionMode} session is available near you. Class ${state?.classInfo?.label}, Date: ${preferredDate}, Time: ${preferredTime}. Tap Nearby Offers to accept.`,
                            mentor_fare: mentorFare,
                            is_read: false
                        });
                    }
                } catch (mentorNotifErr) {
                    console.error('Mentor notification error:', mentorNotifErr);
                }
            }

            setIsSuccess(true);
        } catch (err: any) {
            console.error("Booking Error:", err);
            if (err.message !== "Payment cancelled by user") {
                showAlert("Failed to confirm booking: " + err.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!state || !state.selectedUnits || state.selectedUnits.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pt-[64px]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-12 rounded-[40px] shadow-xl border border-gray-100 max-w-md w-full"
                    >
                        <div className="w-20 h-20 bg-orange-50 text-[#a0522d] rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <FaClipboardList size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cart Empty</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 mb-8">Please select units to proceed with booking</p>
                        <Link
                            href={`/class/${typeof window !== 'undefined' ? localStorage.getItem('last_visited_class_id') || '1' : '1'}`}
                            className="w-full bg-[#1B2A5A] hover:bg-[#142044] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#1B2A5A]/20 block text-center"
                        >
                            Return to Class Page
                        </Link>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    const { selectedUnits, classInfo, curriculum } = state;

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pt-[64px]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 max-w-xl w-full"
                    >
                        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-100/50">
                            <FaCheckCircle size={48} />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Request Sent!</h2>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm mx-auto mb-10">
                            We've received your booking for <span className="text-[#a0522d] font-bold">{selectedUnits.length} session(s)</span>.
                            Our team will manually assign a mentor and contact you at <span className="font-bold">{phone}</span> shortly.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-[#1B2A5A] hover:bg-[#142044] text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-[#1B2A5A]/20"
                        >
                            Back to Home
                        </button>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pt-[64px]">
            <Header />

            <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">
                <Link
                    href={`/class/${classInfo?.id?.toString() || (typeof window !== 'undefined' ? localStorage.getItem('last_visited_class_id') || '1' : '1')}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all font-black text-[10px] uppercase tracking-widest mb-10 group relative z-10"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to {classInfo?.label || 'Class'}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form Section */}
                    <div className="lg:col-span-8 space-y-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10"
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-orange-50 text-[#a0522d] rounded-2xl flex items-center justify-center">
                                    <FaUser size={20} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Booking Registration</h1>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Provide student information for the tutor</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                {/* Personal Details */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] mb-6 flex items-center gap-3">
                                        <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Primary Enrollee
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Full Name</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#a0522d] transition-colors">
                                                    <FaUser size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    autoComplete="name"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1B2A5A] focus:border-[#1B2A5A] transition duration-200 text-sm font-bold"
                                                    placeholder="Enter your name"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Contact Email</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#a0522d] transition-colors">
                                                    <FaEnvelope size={14} />
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    autoComplete="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1B2A5A] focus:border-[#1B2A5A] transition duration-200 text-sm font-bold"
                                                    placeholder="name@email.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Phone Number</label>
                                            <div className="relative group flex items-center bg-white rounded-lg border border-gray-200 focus-within:ring-[#1B2A5A] focus-within:ring-1 transition-all overflow-hidden h-[44px]">
                                                <div className="flex items-center pl-5 pr-3 text-gray-500 group-focus-within:text-[#1B2A5A] border-r border-gray-100 py-2 h-full">
                                                    <span className="font-black text-sm">+91</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    required
                                                    autoComplete="tel"
                                                    value={phone}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setPhone(val);
                                                    }}
                                                    className="w-full px-4 py-2 bg-transparent outline-none text-sm font-bold placeholder:text-gray-500"
                                                    placeholder="00000 00000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-sm font-bold text-[#1B2A5A] ml-1">Full Service Address</label>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!navigator.geolocation) {
                                                            showAlert("Geolocation is not supported by your browser");
                                                            return;
                                                        }
                                                        setAddress("Fetching location...");
                                                        navigator.geolocation.getCurrentPosition(async (position) => {
                                                            const { latitude, longitude } = position.coords;
                                                            setLat(latitude);
                                                            setLng(longitude);
                                                            try {
                                                                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
                                                                const data = await response.json();
                                                                if (data && data.display_name) {
                                                                    setAddress(data.display_name);
                                                                } else {
                                                                    setAddress(`${latitude}, ${longitude}`);
                                                                }
                                                            } catch (error) {
                                                                console.error("Error fetching address:", error);
                                                                setAddress(`${latitude}, ${longitude}`);
                                                            }
                                                        }, () => {
                                                            setAddress("Location access denied.");
                                                        });
                                                    }}
                                                    className="text-[9px] font-black uppercase tracking-widest text-[#a0522d] hover:text-[#804224] flex items-center gap-1.5 transition-colors"
                                                >
                                                    <FaMapMarkerAlt size={8} /> Auto-Detect
                                                </button>
                                            </div>
                                            <div className="relative group col-span-full">
                                                <textarea
                                                    required
                                                    autoComplete="street-address"
                                                    value={address}
                                                    onChange={e => setAddress(e.target.value)}
                                                    rows={1}
                                                    className="w-full px-6 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1B2A5A] focus:border-[#1B2A5A] transition duration-200 text-sm font-bold resize-none"
                                                    placeholder="Door No, Street, Landmark, City..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Class Type */}
                                <div className="space-y-6 pt-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] mb-6 flex items-center gap-3">
                                        <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Session Format
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {[
                                            { id: 'individual', icon: <FaUser size={14} />, title: '1-on-1 Session', desc: 'Single student session' },
                                            { id: 'group', icon: <FaUsers size={14} />, title: 'Group Session', desc: 'Multiple students (Max 5)' }
                                        ].map(option => (
                                            <label
                                                key={option.id}
                                                className={`relative flex items-center gap-4 p-4 rounded-[24px] cursor-pointer transition-all border-2 ${classType === option.id
                                                    ? 'border-[#a0522d] bg-[#a0522d]/5 shadow-xl shadow-[#a0522d]/5'
                                                    : 'border-transparent bg-gray-50/50 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="classType"
                                                    value={option.id}
                                                    checked={classType === option.id}
                                                    onChange={() => setClassType(option.id as any)}
                                                    className="absolute top-3.5 right-3.5 w-3.5 h-3.5 accent-[#a0522d]"
                                                />
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${classType === option.id ? 'bg-[#a0522d] text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                    {option.icon}
                                                </div>
                                                <div className="space-y-0 pr-6">
                                                    <span className="block text-[10.5px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">{option.title}</span>
                                                    <span className="block text-[9.5px] text-gray-500 font-medium leading-tight">{option.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Row 2: Learning Environment (Styled like Session Format) */}
                                <div className="space-y-5 pt-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a0522d] mb-4 flex items-center gap-3">
                                        <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Learning Environment
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {[
                                            { id: 'offline', icon: <FaHome size={14} />, title: 'Face-to-Face', desc: 'At your home or library' },
                                            { id: 'online', icon: <FaWifi size={14} />, title: 'Virtual Session', desc: 'Interactive video call' }
                                        ].map(mode => (
                                            <label
                                                key={mode.id}
                                                className={`relative flex items-center gap-4 p-4 rounded-[24px] cursor-pointer transition-all border-2 ${sessionMode === mode.id
                                                    ? 'border-[#a0522d] bg-[#a0522d]/5 shadow-xl shadow-[#a0522d]/5'
                                                    : 'border-transparent bg-gray-50/50 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="sessionMode"
                                                    value={mode.id}
                                                    checked={sessionMode === mode.id}
                                                    onChange={() => setSessionMode(mode.id as any)}
                                                    className="absolute top-3.5 right-3.5 w-3.5 h-3.5 accent-[#a0522d]"
                                                />
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sessionMode === mode.id ? 'bg-[#a0522d] text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                    {mode.icon}
                                                </div>
                                                <div className="space-y-0 pr-6">
                                                    <span className="block text-[10.5px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">{mode.title}</span>
                                                    <span className="block text-[9.5px] text-gray-500 font-medium leading-tight">{mode.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Row 3: Date (Left) and Time Selection (Right) */}
                                <div className="space-y-10 pt-10">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                        {/* Date Selection - 5/12 width */}
                                        <div className="md:col-span-5 space-y-6">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] flex items-center gap-3">
                                                <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Choose Your Date
                                            </h3>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#a0522d] transition-colors">
                                                    <FaCalendarAlt size={14} />
                                                </div>
                                                <input
                                                    type="date"
                                                    required
                                                    value={preferredDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={e => setPreferredDate(e.target.value)}
                                                    className="w-full pl-12 pr-5 py-3.5 bg-white border-2 border-gray-100 rounded-[22px] outline-none focus:border-[#a0522d] focus:bg-white transition-all text-[13px] font-black shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Time Selection - 7/12 width */}
                                        <div className="md:col-span-7 space-y-5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a0522d] flex items-center gap-3">
                                                    <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> <FaClock size={11} className="opacity-70" /> Available Hours
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                {availableSlots.length > 0 ? (
                                                    availableSlots.map((time) => {
                                                        const isSelected = preferredTime === time;
                                                        return (
                                                            <button
                                                                key={time}
                                                                type="button"
                                                                onClick={() => setPreferredTime(isSelected ? '' : time)}
                                                                className={`py-3 px-1 rounded-xl text-[9px] font-black transition-all border-2 flex flex-col items-center justify-center gap-0 ${isSelected
                                                                    ? 'bg-[#a0522d] border-[#a0522d] text-white shadow-lg shadow-[#a0522d]/20 scale-[1.02]'
                                                                    : 'bg-white border-gray-50 text-gray-400 hover:border-orange-100 hover:text-[#a0522d]'
                                                                    }`}
                                                            >
                                                                <span className="text-[10px] tracking-tight">{time.split(' ')[0]}</span>
                                                                <span className={`text-[7.5px] font-bold uppercase tracking-tighter ${isSelected ? 'text-white/70' : 'text-gray-300'}`}>
                                                                    {time.split(' ')[1]}
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="col-span-full py-4 bg-orange-50/50 rounded-xl border border-dashed border-orange-200 text-center">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#a0522d]">No remaining slots for today</p>
                                                        <p className="text-[8px] text-gray-400 font-bold mt-0.5">Please select another date</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="hidden" required value={preferredTime} />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Group Fields */}
                                <AnimatePresence>
                                    {classType === 'group' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-6 pt-8 border-t border-gray-100 bg-[#F8FAFC]/50 p-8 rounded-[40px] mt-6">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Additional Peers</h3>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Multi-student registration</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddStudent}
                                                        className="bg-white text-[#a0522d] text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all"
                                                    >
                                                        + Add Student
                                                    </button>
                                                </div>

                                                {additionalStudents.length === 0 ? (
                                                    <div className="text-center py-10 bg-white/40 border-2 border-dashed border-gray-200 rounded-[32px] text-[10px] font-black uppercase tracking-widest text-gray-300">
                                                        No group members added
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {additionalStudents.map((student, index) => (
                                                            <motion.div
                                                                key={student.id}
                                                                initial={{ x: 20, opacity: 0 }}
                                                                animate={{ x: 0, opacity: 1 }}
                                                                className="flex flex-col sm:flex-row gap-4 items-center bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm group"
                                                            >
                                                                <div className="w-10 h-10 bg-[#a0522d] text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-[#a0522d]/20 shrink-0">
                                                                    {index + 2}
                                                                </div>
                                                                <div className="flex-1 w-full space-y-1">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Member Name</label>
                                                                    <input
                                                                        type="text"
                                                                        required
                                                                        value={student.name}
                                                                        onChange={e => handleStudentChange(student.id, 'name', e.target.value)}
                                                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-50 rounded-2xl outline-none text-xs font-bold focus:bg-white focus:border-[#a0522d] transition-all"
                                                                        placeholder="Enter your name"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 w-full space-y-1">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Email (Optional)</label>
                                                                    <input
                                                                        type="email"
                                                                        value={student.email}
                                                                        onChange={e => handleStudentChange(student.id, 'email', e.target.value)}
                                                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-50 rounded-2xl outline-none text-xs font-bold focus:bg-white focus:border-[#a0522d] transition-all"
                                                                        placeholder="name@email.com"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveStudent(student.id)}
                                                                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                                                >
                                                                    <FaTrash size={12} />
                                                                </button>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="pt-10">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-[#1B2A5A] to-[#2A4185] hover:scale-[1.01] active:scale-95 disabled:bg-gray-300 text-white py-6 rounded-[28px] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-[#1B2A5A]/30 flex justify-center items-center gap-4"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>Confirm Appointment <FaCheckCircle /></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-[100px]"
                        >
                            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8">Summary</h2>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2 bg-gray-900 p-6 rounded-[32px] shadow-xl shadow-gray-900/10 mb-6">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#ffb76c] text-[#1B2A5A] rounded-xl flex items-center justify-center font-black">
                                                    ₹
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Base Fare</p>
                                                    <p className="text-lg font-black text-white tracking-tight">₹{basePrice}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Charges (23%)</p>
                                                    <div className="group relative">
                                                        <FaInfoCircle size={10} className="text-[#ffb76c]/60 cursor-help" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                                                    <span className="text-gray-400">TDS (3%)</span>
                                                                    <span className="text-gray-900">₹{Math.round(basePrice * 0.03)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                                                    <span className="text-gray-400">GST (18%)</span>
                                                                    <span className="text-gray-900">₹{Math.round(basePrice * 0.18)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                                                                    <span className="text-gray-400">PG Charges (2%)</span>
                                                                    <span className="text-gray-900">₹{Math.round(basePrice * 0.02)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-[#ffb76c]">₹{charges}</p>
                                            </div>

                                        <div className="flex justify-between items-center pt-3 border-t-2 border-white/10">
                                            <div>
                                                <p className="text-[9px] font-black text-[#ffb76c] uppercase tracking-widest leading-none mb-1">Total Amount</p>
                                                <p className="text-2xl font-black text-white tracking-tighter">₹{totalPrice}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Est. Duration</p>
                                                <p className="text-sm font-black text-white/90">{totalDuration / 60} Hour{totalDuration / 60 !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 px-1">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                            <FaGraduationCap size={14} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{curriculum}</p>
                                            <p className="text-sm font-black text-gray-900">{classInfo.label}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#a0522d] border-b border-orange-50 pb-3">Enrolled Units ({selectedUnits.length})</h3>
                                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {selectedUnits.map((item, index) => (
                                            <div key={index} className="bg-gray-50/50 p-5 rounded-[24px] border border-gray-50 group hover:bg-white hover:border-orange-100 transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">{item.subject.name}</p>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-green-600">{(item.topic.estimated_duration || 60) / 60} Hour</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-gray-800 leading-relaxed">{item.topic.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <div className="bg-[#1B2A5A]/5 p-5 rounded-[24px] border border-[#1B2A5A]/10">
                                        <div className="flex items-center gap-3 text-[#1B2A5A] mb-2">
                                            <FaCheckCircle className="shrink-0" size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Instant Activation</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                            Upon successful payment, your booking will be initiated and a mentor will be assigned within 24 hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default BookingPage;
