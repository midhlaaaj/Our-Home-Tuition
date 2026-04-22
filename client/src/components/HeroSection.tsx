"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';

interface HeroSectionProps {
    initialHeroData?: any;
}

const HeroSection: React.FC<HeroSectionProps> = ({ initialHeroData }) => {
    // Parse initial data helper
    const parseTitle = (rawTitle: string | null) => {
        let parsedTitle = rawTitle || 'Helping Young\nMinds Grow\nwith *Confidence*';
        let parsedColor = '#c75e33';
        if (parsedTitle.includes('|||')) {
            const parts = parsedTitle.split('|||');
            parsedTitle = parts[0];
            parsedColor = parts[1];
        }
        return { text: parsedTitle, color: parsedColor };
    };

    const initialParsed = parseTitle(initialHeroData?.title);

    const [mediaUrl, setMediaUrl] = useState<string | null>(initialHeroData?.media_url || null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(initialHeroData?.type as 'image' | 'video' || 'image');
    const [title, setTitle] = useState<string>(initialParsed.text);
    const [titleColor, setTitleColor] = useState<string>(initialParsed.color);
    const [subtitle, setSubtitle] = useState<string>(initialHeroData?.subtitle || 'Structured subject roadmaps, qualified home tutors, and\npersonalized learning for students from Class 1 to 10 —\nall at the comfort of your home.');
    const [loading, setLoading] = useState(!initialHeroData);
    const router = useRouter();

    const initialized = React.useRef(false);

    useEffect(() => {
        // If we already have initial data, we've already rendered it. 
        // We can still fetch in the background to ensure consistency, but we don't need to block 'loading' state.
        if (initialized.current) return;
        initialized.current = true;
        
        const fetchHeroMedia = async () => {
            try {
                const result = await safeFetch(async () => {
                    return await supabase
                        .from('sliders')
                        .select('media_url, type, title, subtitle')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                }, { requestId: 'Hero' });

                const { data, error } = result;

                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching hero media:", error);
                }

                if (data) {
                    if (data.media_url) setMediaUrl(data.media_url);
                    if (data.type) setMediaType(data.type as 'image' | 'video');
                    const { text, color } = parseTitle(data.title);
                    setTitle(text);
                    setTitleColor(color);
                    if (data.subtitle) setSubtitle(data.subtitle);
                } else if (!initialHeroData) {
                    // Fallback only if we don't have initial data
                    setTitle('Helping Young\nMinds Grow\nwith *Confidence*');
                    setSubtitle('Structured subject roadmaps, qualified home tutors, and\npersonalized learning for students from Class 1 to 10 —\nall at the comfort of your home.');
                }
            } catch (err) {
                console.error("Unexpected error fetching hero media:", err);
            } finally {
                setLoading(false);
            }
        };

        // If we don't have initial data, we must fetch.
        // If we HAVE initial data, we could skip the fetch to save resources, 
        // or still fetch to ensure the most recent data (SWR pattern).
        // For now, let's fetch to be safe, but since loading is already false, it won't flicker.
        fetchHeroMedia();
    }, [initialHeroData]);

    const renderTitle = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, lineIndex) => {
            const parts = line.split('*');
            return (
                <React.Fragment key={lineIndex}>
                    {parts.map((part, index) => {
                        if (index % 2 === 1) {
                            return (
                                <span key={index} style={{ color: titleColor }} className="relative inline-block drop-shadow-md">
                                    {part}
                                </span>
                            );
                        }
                        return <span key={index}>{part}</span>;
                    })}
                    {lineIndex < lines.length - 1 && <br />}
                </React.Fragment>
            );
        });
    };

    const renderSubtitle = (text: string) => {
        return text.split('\n').map((line, index, array) => (
            <React.Fragment key={index}>
                {line}
                {index < array.length - 1 && <br className="hidden sm:block" />}
            </React.Fragment>
        ));
    };

    return (
        <section className="relative w-full min-h-screen flex flex-col justify-center bg-gray-900 overflow-hidden">
            {/* Full Width Background Media */}
            <div className="absolute inset-0 z-0">
                {(mediaUrl) ? (
                    <>
                        {mediaType === 'video' ? (
                            <video
                                src={mediaUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Image
                                src={mediaUrl}
                                alt="Student learning from home with Our Home Tuition tutor"
                                title="Personalized Home Tutoring Service"
                                fill
                                className="object-cover"
                                priority
                                sizes="100vw"
                            />
                        )}
                        {/* Consistent dark transparent overlay covering the entire image to match reference */}
                        <div className="absolute inset-0 bg-black/30 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#17242e] via-[#17242e]/60 to-transparent w-full md:w-1/2"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-[#17242e] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-[#17242e]"></div>
                    </div>
                )}
            </div>

            <div className="w-full px-6 sm:px-10 lg:px-24 mx-auto relative z-10 flex-grow flex flex-col justify-center">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 w-full">

                    {/* Left Content Column */}
                    <div className={`w-full lg:w-[65%] flex flex-col items-start text-left mt-36 lg:mt-32 transition-opacity duration-700 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}>
                            <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-[70px] font-extrabold text-white leading-[1.1] mb-6 animate-fade-in-up tracking-tight font-['Urbanist']" style={{ animationDelay: '0.1s' }}>
                                {renderTitle(title)}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed animate-fade-in-up drop-shadow-sm max-w-2xl font-normal" style={{ animationDelay: '0.2s' }}>
                                {renderSubtitle(subtitle)}
                            </p>
 
                            <div className="flex flex-row gap-3 w-full sm:w-auto animate-fade-in-up mb-14" style={{ animationDelay: '0.3s' }}>
                                <button
                                    onClick={() => router.push('/class/1')}
                                    className="px-4 sm:px-8 py-3.5 bg-[#b35a2e] hover:bg-[#c75e33] text-white font-bold rounded-xl outline-none transition-all shadow-lg flex-1 sm:flex-none text-center text-sm sm:text-base whitespace-nowrap"
                                >
                                    Explore Classes
                                </button>
                                <button
                                    onClick={() => document.getElementById('mentors')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-4 sm:px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md font-bold rounded-xl transition-all shadow-md border border-white/20 hover:border-white/30 flex-1 sm:flex-none text-center text-sm sm:text-base whitespace-nowrap"
                                >
                                    View Tutors
                                </button>
                            </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
