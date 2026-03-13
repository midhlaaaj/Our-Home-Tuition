import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { FaStar, FaCheckCircle, FaChevronLeft, FaPaperPlane } from 'react-icons/fa';

const WriteReview: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<any>(null);
    const [mentor, setMentor] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: bookingData, error: bError } = await supabase
                    .from('bookings')
                    .select('*, mentors(*)')
                    .eq('id', bookingId)
                    .single();

                if (bError || !bookingData) throw new Error("Booking not found");
                
                setBooking(bookingData);
                setMentor(bookingData.mentors);
            } catch (err) {
                console.error(err);
                alert("Invalid or missing booking information.");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) fetchData();
    }, [bookingId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking || !mentor) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from('mentor_reviews').insert([{
                booking_id: booking.id,
                mentor_id: mentor.id,
                parent_id: booking.user_id,
                rating,
                comment: message,
                is_public: false // Admin decides
            }]);

            if (error) throw error;
            setSubmitted(true);
        } catch (err: any) {
            console.error(err);
            alert("Error submitting review: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-12 h-12 border-4 border-[#a0522d]/20 border-t-[#a0522d] rounded-full animate-spin"></div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-['Urbanist']">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-md w-full border border-gray-100"
            >
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <FaCheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Review Submitted!</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-loose mb-10">
                    Thank you for your feedback. We appreciate your time in helping us improve our services.
                </p>
                <button 
                    onClick={() => navigate('/')}
                    className="w-full py-5 bg-[#1B2A5A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20"
                >
                    Back to Home
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-['Urbanist'] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-12 group"
                >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-gray-50">
                        <FaChevronLeft size={12} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Go Back</span>
                </button>

                <div className="bg-white rounded-[50px] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#1B2A5A] p-12 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Session Feedback</h1>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Rate your experience with your mentor</p>
                        </div>
                        {/* Abstract shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#a0522d]/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>
                    </div>

                    <div className="p-12">
                        {mentor && (
                            <div className="flex items-center gap-6 mb-12 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                <div className="w-20 h-20 rounded-[24px] overflow-hidden border-4 border-white shadow-lg bg-white">
                                    <img src={mentor.image_url} alt={mentor.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Mentor</p>
                                    <h2 className="text-xl font-black text-gray-900 leading-none">{mentor.name}</h2>
                                    <p className="text-xs font-bold text-[#a0522d] mt-2">{mentor.subject}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-12">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-1">How would you rate the session?</p>
                                <div className="flex justify-center gap-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className="transition-all duration-300 transform hover:scale-125"
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            onClick={() => setRating(star)}
                                        >
                                            <FaStar
                                                size={48}
                                                className={`transition-colors duration-200 ${
                                                    star <= (hover || rating) ? 'text-[#ffb76c] drop-shadow-[0_0_15px_rgba(255,183,108,0.4)]' : 'text-gray-100'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Describe your experience</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Tell us what you liked or where we can improve..."
                                    className="w-full p-8 bg-gray-50 border border-gray-100 rounded-[32px] text-sm font-bold text-gray-600 focus:border-[#a0522d] outline-none transition-all placeholder:text-gray-300 resize-none"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-6 bg-[#1B2A5A] text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#142044] transition-all shadow-2xl shadow-[#1B2A5A]/30 flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {isSubmitting ? "Sending..." : "Submit Review"}
                                {!isSubmitting && <FaPaperPlane size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WriteReview;
