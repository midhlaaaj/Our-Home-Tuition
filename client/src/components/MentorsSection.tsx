"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';

interface Mentor {
    id: string;
    name: string;
    subject: string;
    description: string;
    image_url: string;
    is_active: boolean;
}

const MentorsSection: React.FC = () => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4);
    const [isDragging, setIsDragging] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const initialized = React.useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const fallbackMentors: Mentor[] = [
            { id: '1', name: 'Dr. Sarah Wilson', subject: 'Mathematics', description: 'Expert in Algebra and Calculus with over 10 years of teaching experience.', image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop', is_active: true },
            { id: '2', name: 'Prof. David Chen', subject: 'Physics', description: 'Specializes in Quantum Mechanics and High School Physics preparation.', image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop', is_active: true },
            { id: '3', name: 'Emily Thompson', subject: 'English', description: 'PhD in Literature, helping students master creative writing and grammar.', image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop', is_active: true },
            { id: '4', name: 'James Rodriguez', subject: 'Science', description: 'Biology and Chemistry expert focused on making complex concepts simple.', image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop', is_active: true }
        ];

        const fetchMentors = async () => {
            try {
                const result = await safeFetch(async () => {
                    return await supabase
                        .from('mentors')
                        .select('*')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false });
                }, { requestId: 'Mentors' });
                const { data, error } = result;
                if (error) throw error;
                if (data && data.length > 0) {
                    const uniqueMentors = Array.from(new Set(data.map(m => m.id)))
                        .map(id => data.find(m => m.id === id));
                    setMentors(uniqueMentors as Mentor[]);
                } else {
                    setMentors(fallbackMentors);
                }
            } catch (err) {
                setMentors(fallbackMentors);
            } finally {
                setLoading(false);
            }
        };

        fetchMentors();

        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerPage(1);
            else if (window.innerWidth < 768) setItemsPerPage(2);
            else if (window.innerWidth < 1024) setItemsPerPage(3);
            else setItemsPerPage(4);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateScrollProgress = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll <= 0) {
            setScrollProgress(0);
            return;
        }
        setScrollProgress(Math.max(0, Math.min(1, scrollLeft / maxScroll)));
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const { clientWidth } = scrollContainerRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    const thumbWidthPercent = mentors.length > 0 ? Math.max(15, (itemsPerPage / mentors.length) * 100) : 100;

    const setScrollFromRatio = useCallback((ratio: number) => {
        if (!scrollContainerRef.current) return;
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        const maxScroll = scrollWidth - clientWidth;
        scrollContainerRef.current.scrollTo({
            left: ratio * maxScroll,
            behavior: isDragging ? 'auto' : 'smooth'
        });
    }, [isDragging]);

    const handleTrackInteraction = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const trackWidth = rect.width;
        
        const thumbWidthPx = (thumbWidthPercent / 100) * trackWidth;
        const scrollableTrackRange = trackWidth - thumbWidthPx;
        
        const ratio = Math.max(0, Math.min(1, (x - thumbWidthPx / 2) / scrollableTrackRange));
        setScrollFromRatio(ratio);
    }, [thumbWidthPercent, setScrollFromRatio]);

    const handleDrag = useCallback((e: MouseEvent) => {
        handleTrackInteraction(e.clientX);
    }, [handleTrackInteraction]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
    }, [handleDrag]);

    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
    }, [handleDrag, handleDragEnd]);

    const handleTouchDrag = useCallback((e: TouchEvent) => {
        handleTrackInteraction(e.touches[0].clientX);
    }, [handleTrackInteraction]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('touchmove', handleTouchDrag);
        document.removeEventListener('touchend', handleTouchEnd);
    }, [handleTouchDrag]);

    const handleTouchStart = useCallback(() => {
        setIsDragging(true);
        document.addEventListener('touchmove', handleTouchDrag);
        document.addEventListener('touchend', handleTouchEnd);
    }, [handleTouchDrag, handleTouchEnd]);

    if (loading) return <div className="py-20 text-center text-gray-500 font-['Urbanist']">Loading mentors...</div>;
    if (mentors.length === 0) return null;

    return (
        <section id="mentors" className="py-10 bg-[#374151] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                    <h3 className="text-[#ffb76c] font-semibold text-lg mb-2 font-['Urbanist']">Meet the mentors</h3>
                    <h2 className="text-4xl font-bold text-white font-['Urbanist']">
                        Clear your doubts with <span className="text-[#ffb76c]">expert mentorship</span>
                    </h2>
                </div>

                <div className="relative mx-auto group">
                    {/* Cards Slider Container - REMOVED SNAP AND SMOOTH CLASS */}
                    <div 
                        ref={scrollContainerRef}
                        onScroll={updateScrollProgress}
                        className="flex overflow-x-auto scrollbar-hide py-4 px-2 h-full gap-0 overflow-y-hidden"
                    >
                        {mentors.map((mentor) => (
                            <div
                                key={mentor.id}
                                className="px-3 flex-shrink-0"
                                style={{ width: `${100 / itemsPerPage}%` }}
                            >
                                <div className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img
                                            src={mentor.image_url}
                                            alt={mentor.name}
                                            className="w-full h-full object-cover pointer-events-none"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-5 flex-grow flex flex-col">
                                        <div className="mb-3">
                                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold tracking-wide uppercase">
                                                {mentor.subject}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{mentor.name}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                            {mentor.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Custom Scrollbar Controls */}
                    {mentors.length > itemsPerPage && (
                        <div className="mt-8 flex items-center px-3">
                            <button
                                onClick={() => scroll('left')}
                                disabled={scrollProgress <= 0.01}
                                className="text-gray-400 hover:text-gray-600 disabled:text-gray-200 transition-colors mr-3 flex-shrink-0"
                                aria-label="Previous"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div
                                ref={trackRef}
                                onMouseDown={(e) => {
                                    if (e.target === e.currentTarget) handleTrackInteraction(e.clientX);
                                }}
                                className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer select-none"
                            >
                                <div
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleTouchStart}
                                    className="absolute top-0 h-full bg-[#1F2937] rounded-full"
                                    style={{
                                        width: `${thumbWidthPercent}%`,
                                        left: `${scrollProgress * (100 - thumbWidthPercent)}%`,
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                    }}
                                />
                            </div>

                            <button
                                onClick={() => scroll('right')}
                                disabled={scrollProgress >= 0.99}
                                className="text-gray-400 hover:text-gray-600 disabled:text-gray-200 transition-colors ml-3 flex-shrink-0"
                                aria-label="Next"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};

export default MentorsSection;
