import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';


interface Slide {
    id: string;
    title: string;
    subtitle?: string;
    type: 'image' | 'video' | 'text';
    media_url?: string;
}

// Cinematic ease
const TRANSITION_DURATION = 0.6;
const DRAG_BUFFER = 50;

// Premium variants for slide container
// No opacity fade on enter/exit to prevent white flash
// zIndex ensures proper stacking order:
// enter: on top of exit (or below if moving back? usually on top looks better for "slide over")
// actually, standard slider is "push":
// incoming pushes outgoing.
// Side-by-side:
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 1,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 1,
    })
};

// Text parallax effect removed for smoothness
const textVariants = {
    enter: { opacity: 1, x: 0 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 1, x: 0 }
};


const HeroSlider: React.FC = () => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [[page, direction], setPage] = useState([0, 0]);

    const imageIndex = slides.length > 0 ? Math.abs(page % slides.length) : 0;

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const { data, error } = await supabase
                    .from('sliders')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (error) throw error;
                if (data && data.length > 0) {
                    setSlides(data);
                }
            } catch (err) {
                console.error('Failed to fetch slides', err);
            }
        };

        fetchSlides();
    }, []);

    // Memoize paginate to prevent recreation
    const paginate = useCallback((newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    }, [page]);

    // Enhanced Auto-play with cleanup
    useEffect(() => {
        if (slides.length === 0) return;
        const timer = setInterval(() => {
            paginate(1);
        }, 6000); // 6s duration for readability
        return () => clearInterval(timer);
    }, [paginate, slides.length]); // Depend on paginate (stable due to page dependency?) 
    // Wait, paginate depends on page. So effect re-runs on page change.
    // This effectively resets timer on manual navigation too, which is DESIRED interaction.

    if (slides.length === 0) {
        return (
            <div className="relative w-full h-[520px] md:h-[600px] overflow-hidden rounded-2xl shadow-xl mt-4 mx-auto max-w-7xl bg-gray-900 animate-pulse flex items-center justify-center">
                <span className="text-gray-500">Loading...</span>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-7xl mx-auto h-[500px] md:h-[600px] mt-4 rounded-2xl overflow-hidden shadow-2xl group bg-gray-900">
            <AnimatePresence initial={false} custom={direction} mode='popLayout'>
                {/* mode='popLayout' ensures exiting component is taken out of flow? 
                    Actually, if 'absolute', popLayout helps avoid layout shifts?
                    Standard sliders often use sync.
                    Let's try WITHOUT popLayout first to ensure overlap is perfect?
                    User complained about "cut off". 
                    "Overlapping Slide Transition": Exiting remains visible.
                    If mode is not wait, they overlap.
                    Let's use default (sync).
                 */}
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "tween", ease: [0.25, 1, 0.5, 1], duration: TRANSITION_DURATION }, // Soft cushion ease
                            opacity: { duration: 0.2 } // Fade is subtle or none
                        }}
                        style={{ willChange: "transform" }} // GPU Hint
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(_, { offset, velocity }) => {
                            const swipe = Math.abs(offset.x) * velocity.x;
                            if (swipe < -DRAG_BUFFER) {
                                paginate(1);
                            } else if (swipe > DRAG_BUFFER) {
                                paginate(-1);
                            }
                        }}
                        className="absolute inset-0 bg-transparent text-white flex flex-col justify-center items-center text-center p-8 overflow-hidden"
                    >
                        {/* Media Layer */}
                        {slides[imageIndex].type === 'image' && slides[imageIndex].media_url && (
                            <motion.img
                                src={slides[imageIndex].media_url}
                                alt={slides[imageIndex].title || 'Slide Image'}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                draggable="false"
                                style={{ willChange: 'transform' }}
                            />
                        )}
                        {slides[imageIndex].type === 'video' && slides[imageIndex].media_url && (
                            <video
                                src={slides[imageIndex].media_url}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                        )}

                        {/* Gradient Overlay - Fixed z-index to be on top of media but below text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                        {/* Text Layer - Parallax */}
                        <motion.div
                            className="relative z-10 max-w-2xl px-4 pointer-events-none"
                            variants={textVariants}
                            custom={direction}
                        >
                            {slides[imageIndex].title && (
                                <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg text-white">
                                    {slides[imageIndex].title}
                                </h1>
                            )}
                            {slides[imageIndex].subtitle && (
                                <p className="text-xl md:text-2xl font-light drop-shadow-md text-gray-200">
                                    {slides[imageIndex].subtitle}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </AnimatePresence>

            {/* Left Sensitive Zone - Button at VERY START (far left) */}
            <div className="absolute top-0 left-0 h-full w-[15%] flex items-center justify-start pl-2 z-20 group/left">
                <button
                    onClick={() => paginate(-1)}
                    className="transition-all duration-300 transform opacity-0 group-hover/left:opacity-100 group-hover/left:scale-110 hover:!scale-125 text-white/70 hover:text-white drop-shadow-lg p-2"
                    aria-label="Previous Slide"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>

            {/* Right Sensitive Zone - Button at VERY END (far right) */}
            <div className="absolute top-0 right-0 h-full w-[15%] flex items-center justify-end pr-2 z-20 group/right">
                <button
                    onClick={() => paginate(1)}
                    className="transition-all duration-300 transform opacity-0 group-hover/right:opacity-100 group-hover/right:scale-110 hover:!scale-125 text-white/70 hover:text-white drop-shadow-lg p-2"
                    aria-label="Next Slide"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            const newDirection = index > imageIndex ? 1 : -1;
                            setPage([page + (index - imageIndex), newDirection]);
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm cursor-pointer ${index === imageIndex ? 'bg-[#e69b48] w-8' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
