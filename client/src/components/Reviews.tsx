import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';
import { FaStar } from 'react-icons/fa';

interface Review {
    id: string;
    name: string;
    role: string;
    rating: number;
    message: string;
    avatar_url: string;
    is_active: boolean;
}

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Refs for animations
    const row1Ref = useRef<HTMLDivElement>(null);
    const row2Ref = useRef<HTMLDivElement>(null);
    const anim1Ref = useRef<Animation | null>(null);
    const anim2Ref = useRef<Animation | null>(null);

    // Refs for smooth speed transition
    const animationFrameId = useRef<number | null>(null);
    const currentSpeed = useRef(1); // Current playback rate
    const targetSpeed = useRef(1); // Target playback rate

    const initialized = React.useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const fetchReviews = async () => {
            try {
                const [siteRes, mentorRes] = await Promise.all([
                    safeFetch(async () => await supabase.from('reviews').select('*').eq('is_active', true).order('created_at', { ascending: false }), { requestId: 'Reviews-Site' }),
                    safeFetch(async () => await supabase.from('mentor_reviews').select('*, mentors(image_url), bookings(primary_student)').eq('is_public', true).order('created_at', { ascending: false }), { requestId: 'Reviews-Mentor' })
                ]) as [any, any];

                if (siteRes.error) throw siteRes.error;
                if (mentorRes.error) throw mentorRes.error;

                const siteReviews: Review[] = siteRes.data || [];
                const mentorReviews: Review[] = (mentorRes.data || []).map((mr: any) => ({
                    id: mr.id,
                    name: mr.bookings?.primary_student?.name || 'Parent',
                    role: 'Verified Parent',
                    rating: mr.rating,
                    message: mr.comment,
                    avatar_url: mr.mentors?.image_url || '',
                    is_active: true
                }));

                setReviews([...siteReviews, ...mentorReviews]);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    // Smooth speed transition loop
    const updateSpeed = () => {
        const factor = 0.05; // 0.05 means ~5% change per frame (smooth ease)
        const diff = targetSpeed.current - currentSpeed.current;

        if (Math.abs(diff) < 0.001) {
            // Close enough, snap to target
            currentSpeed.current = targetSpeed.current;
            if (anim1Ref.current) anim1Ref.current.playbackRate = currentSpeed.current;
            if (anim2Ref.current) anim2Ref.current.playbackRate = currentSpeed.current;
            animationFrameId.current = null; // Stop loop
        } else {
            // Interpolate
            currentSpeed.current += diff * factor;
            if (anim1Ref.current) anim1Ref.current.playbackRate = currentSpeed.current;
            if (anim2Ref.current) anim2Ref.current.playbackRate = currentSpeed.current;
            animationFrameId.current = requestAnimationFrame(updateSpeed);
        }
    };

    // Initialize Animations
    useEffect(() => {
        if (loading || reviews.length === 0) return;

        // Cleanup old animations if any
        if (anim1Ref.current) anim1Ref.current.cancel();
        if (anim2Ref.current) anim2Ref.current.cancel();

        const keyframes = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-50%)' }
        ];

        const options: KeyframeAnimationOptions = {
            duration: 100000, // 100s for smooth speed
            iterations: Infinity,
            easing: 'linear'
        };

        if (row1Ref.current) {
            anim1Ref.current = row1Ref.current.animate(keyframes, options);
        }
        if (row2Ref.current) {
            anim2Ref.current = row2Ref.current.animate(keyframes, options);
        }

        return () => {
            anim1Ref.current?.cancel();
            anim2Ref.current?.cancel();
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [reviews, loading]);

    const handleMouseEnter = () => {
        targetSpeed.current = 0.2; // Slow down target
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(updateSpeed);
    };

    const handleMouseLeave = () => {
        targetSpeed.current = 1; // Normal speed target
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(updateSpeed);
    };

    if (loading || reviews.length === 0) return null;

    // Split reviews between rows automatically
    const row1Data = reviews.filter((_, i) => i % 2 === 0);
    const row2Data = reviews.filter((_, i) => i % 2 !== 0);

    // If one row is empty (only 1 review), duplicate to keep layout
    const finalRow1 = row1Data.length > 0 ? row1Data : reviews;
    const finalRow2 = row2Data.length > 0 ? row2Data : reviews;

    // Duplicate lists to ensure seamless infinite scroll
    const marqueeRow1 = [...finalRow1, ...finalRow1, ...finalRow1, ...finalRow1];
    const marqueeRow2 = [...finalRow2, ...finalRow2, ...finalRow2, ...finalRow2];

    return (
        <section className="py-10 overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
            <div className="container mx-auto px-4 mb-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-['Urbanist']">
                    What People Are Saying
                </h2>
                <p className="text-white/90 max-w-2xl mx-auto text-base sm:text-lg">
                    Hear from our satisfied parents and students about their experience with Hour Home.
                </p>
            </div>

            {/* Container with mouse events for slow-down effect */}
            <div
                className="flex flex-col gap-4 group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Row 1 */}
                <div ref={row1Ref} className="flex w-max">
                    {marqueeRow1.map((review, index) => (
                        <div
                            key={`r1-${review.id}-${index}`}
                            className="w-[280px] md:w-[320px] flex-shrink-0 mx-3"
                        >
                            <div className="bg-white p-3 rounded-xl shadow-lg transition-all duration-300 flex flex-col h-full">
                                <div className="flex-1 flex flex-col">
                                    {/* Stars */}
                                    <div className="flex mb-1.5 space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={`text-[10px] sm:text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Message */}
                                    <p className="text-gray-700 mb-2 leading-snug italic text-xs sm:text-sm line-clamp-3">
                                        "{review.message}"
                                    </p>
                                </div>

                                {/* User Info */}
                                <div className="flex items-center mt-1 pt-2 border-t border-gray-100">
                                    <img
                                        src={review.avatar_url || `https://ui-avatars.com/api/?name=${review.name}&background=random`}
                                        alt={review.name}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2.5 object-cover"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{review.name}</h4>
                                        <p className="text-[#ffb76c] text-[10px] sm:text-xs font-bold leading-tight mt-0.5">{review.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 2 */}
                <div className="-ml-[152px] md:-ml-[172px]">
                    <div ref={row2Ref} className="flex w-max">
                        {marqueeRow2.map((review, index) => (
                            <div
                                key={`r2-${review.id}-${index}`}
                                className="w-[280px] md:w-[320px] flex-shrink-0 mx-3"
                            >
                                <div className="bg-white p-3 rounded-xl shadow-lg transition-all duration-300 flex flex-col h-full">
                                    <div className="flex-1 flex flex-col">
                                        {/* Stars */}
                                        <div className="flex mb-1.5 space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={`text-[10px] sm:text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>

                                        {/* Message */}
                                        <p className="text-gray-700 mb-2 leading-snug italic text-xs sm:text-sm line-clamp-3">
                                            "{review.message}"
                                        </p>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex items-center mt-1 pt-2 border-t border-gray-100">
                                        <img
                                            src={review.avatar_url || `https://ui-avatars.com/api/?name=${review.name}&background=random`}
                                            alt={review.name}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2.5 object-cover"
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{review.name}</h4>
                                            <p className="text-[#ffb76c] text-[10px] sm:text-xs font-bold leading-tight mt-0.5">{review.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
