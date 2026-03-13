import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUsers,
    FaArrowLeft, FaCheckCircle, FaTrash, FaClipboardList, FaGraduationCap,
    FaCalendarAlt, FaClock, FaWifi, FaHome
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationState {
    selectedUnits: { subject: any, topic: any }[];
    classInfo: any;
    curriculum: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

const BookingPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState;

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
    const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
    const [sessionMode, setSessionMode] = useState<'online' | 'offline'>('offline');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const { user } = useAuth();

    // Pre-fill user data
    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || '');
            setEmail(user.email || '');
            setPhone(user.user_metadata?.phone || '');
            setAddress(user.user_metadata?.address || '');
        }
    }, [user]);

    const handleAddStudent = () => {
        setAdditionalStudents([...additionalStudents, { id: Date.now().toString(), name: '', email: '' }]);
    };

    const handleRemoveStudent = (id: string) => {
        setAdditionalStudents(additionalStudents.filter(s => s.id !== id));
    };

    const handleStudentChange = (id: string, field: 'name' | 'email', value: string) => {
        setAdditionalStudents(additionalStudents.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const totalPrice = state?.selectedUnits?.reduce((acc, curr) => acc + (curr.topic.unit_price || 100), 0) || 0;
    const totalDuration = state?.selectedUnits?.reduce((acc, curr) => acc + (curr.topic.estimated_duration || 60), 0) || 0;

    const handleRazorpayPayment = async () => {
        return new Promise((resolve, reject) => {
            const options = {
                key: "rzp_live_9sUUrcW0TGM2K2",
                amount: totalPrice * 100, // Amount in paise
                currency: "INR",
                name: "Our Home Tuition",
                description: `Booking for ${state?.classInfo?.label}`,
                image: "/logo.png",
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
                    ondismiss: function() {
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
            alert("Please sign in to book a session.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Initiate Razorpay Payment
            const paymentResponse: any = await handleRazorpayPayment();
            
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
                        subject_name: su.subject.name,
                        topic_name: su.topic.name,
                        price: su.topic.unit_price || 100
                    })),
                    primary_student: { name, email, phone, address },
                    class_type: classType,
                    additional_students: classType === 'group' ? additionalStudents : [],
                     preferred_date: preferredDate || null,
                    preferred_time: preferredTimes.join(', ') || null,
                    session_mode: sessionMode,
                    latitude: lat,
                    longitude: lng,
                    status: 'pending',
                    otp: otp,
                    paid_amount: totalPrice,
                    total_duration: totalDuration,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_order_id: paymentResponse.razorpay_order_id
                });

            if (error) throw error;

            // Send Notification to Parent
            const { error: notifError } = await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'Order Summary',
                message: 'Payment completed and booking is initiated. Our team will contact you soon.',
                type: 'booking_initiated'
            });

            if (notifError) {
                console.error("Notification Error:", notifError);
            }

            setIsSuccess(true);
        } catch (err: any) {
            console.error("Booking Error:", err);
            if (err.message !== "Payment cancelled by user") {
                alert("Failed to confirm booking: " + err.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!state || !state.selectedUnits || state.selectedUnits.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Urbanist'] pt-[64px]">
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
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full bg-[#1B2A5A] hover:bg-[#142044] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#1B2A5A]/20"
                        >
                            Return to Class Page
                        </button>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    const { selectedUnits, classInfo, curriculum } = state;

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Urbanist'] pt-[64px]">
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
                            onClick={() => navigate('/')}
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
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Urbanist'] pt-[64px]">
            <Header />

            <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">
                <motion.button
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all font-black text-[10px] uppercase tracking-widest mb-10 group"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to {classInfo.label}
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form Section */}
                    <div className="lg:col-span-8 space-y-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10"
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
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#a0522d] transition-colors">
                                                    <FaUser size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[20px] outline-none focus:bg-white focus:border-[#a0522d] transition-all text-sm font-bold placeholder:text-gray-300"
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Email</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#a0522d] transition-colors">
                                                    <FaEnvelope size={14} />
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[20px] outline-none focus:bg-white focus:border-[#a0522d] transition-all text-sm font-bold placeholder:text-gray-300"
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#a0522d] transition-colors">
                                                    <FaPhone size={14} />
                                                </div>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[20px] outline-none focus:bg-white focus:border-[#a0522d] transition-all text-sm font-bold placeholder:text-gray-300"
                                                    placeholder="+91 XXXXX XXXXX"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Service Address</label>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!navigator.geolocation) {
                                                            alert("Geolocation is not supported by your browser");
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
                                                    value={address}
                                                    onChange={e => setAddress(e.target.value)}
                                                    rows={1}
                                                    className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[20px] outline-none focus:bg-white focus:border-[#a0522d] transition-all text-sm font-bold placeholder:text-gray-300 resize-none"
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
                                            { id: 'individual', icon: <FaUser size={14} />, title: 'Premium Solo', desc: '1-on-1 personalized academic coaching' },
                                            { id: 'group', icon: <FaUsers size={14} />, title: 'Collaborative Duo', desc: 'Study with siblings or friends (Group)' }
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
                                                <p className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest">Select multiple</p>
                                            </div>
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                {[
                                                    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                                                    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
                                                    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
                                                ].map((time) => {
                                                    const isSelected = preferredTimes.includes(time);
                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            onClick={() => {
                                                                 if (isSelected) {
                                                                     setPreferredTimes(preferredTimes.filter(t => t !== time));
                                                                 } else {
                                                                     setPreferredTimes([...preferredTimes, time].sort());
                                                                 }
                                                            }}
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
                                                })}
                                            </div>
                                            <input type="hidden" required value={preferredTimes.join(',')} />
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
                                                                        placeholder="Full name"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 w-full space-y-1">
                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Email (Optional)</label>
                                                                    <input
                                                                        type="email"
                                                                        value={student.email}
                                                                        onChange={e => handleStudentChange(student.id, 'email', e.target.value)}
                                                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-50 rounded-2xl outline-none text-xs font-bold focus:bg-white focus:border-[#a0522d] transition-all"
                                                                        placeholder="contact@email.com"
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
                            className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 sticky top-[100px]"
                        >
                            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8">Summary</h2>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl shadow-xl shadow-gray-900/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#ffb76c] text-[#1B2A5A] rounded-xl flex items-center justify-center font-black">
                                                ₹
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Payable Amount</p>
                                                <p className="text-lg font-black text-white tracking-tight">₹{totalPrice}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end pr-1">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total Time</p>
                                            <p className="text-sm font-black text-[#ffb76c]">{totalDuration} Min</p>
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
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] border-b border-orange-50 pb-3">Enrolled Units ({selectedUnits.length})</h3>
                                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {selectedUnits.map((item, index) => (
                                            <div key={index} className="bg-gray-50/50 p-5 rounded-[24px] border border-gray-50 group hover:bg-white hover:border-orange-100 transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{item.subject.name}</p>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-[#a0522d]">₹{item.topic.unit_price || 100}</p>
                                                        <p className="text-[8px] font-bold text-green-600">{item.topic.estimated_duration || 60}m</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-black text-gray-800 leading-relaxed">{item.topic.name}</p>
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
