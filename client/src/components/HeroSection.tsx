import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const HeroSection: React.FC = () => {
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [title, setTitle] = useState<string>('Helping Young\nMinds Grow\nwith *Confidence*');
    const [titleColor, setTitleColor] = useState<string>('#c75e33');
    const [subtitle, setSubtitle] = useState<string>('Structured subject roadmaps, qualified home tutors, and\npersonalized learning for students from Class 1 to 10 —\nall at the comfort of your home.');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHeroMedia = async () => {
            try {
                // Fetch the first active slider which acts as our Hero Media
                const { data, error } = await supabase
                    .from('sliders')
                    .select('media_url, type, title, subtitle')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    // PGRST116 means no rows returned, which is fine
                    console.error("Error fetching hero media:", error);
                }

                if (data) {
                    if (data.media_url) setMediaUrl(data.media_url);
                    if (data.type) setMediaType(data.type as 'image' | 'video');
                    if (data.title) {
                        let parsedTitle = data.title;
                        let parsedColor = '#c75e33';
                        if (parsedTitle.includes('|||')) {
                            const parts = parsedTitle.split('|||');
                            parsedTitle = parts[0];
                            parsedColor = parts[1];
                        }
                        setTitle(parsedTitle);
                        setTitleColor(parsedColor);
                    }
                    if (data.subtitle) setSubtitle(data.subtitle);
                }
            } catch (err) {
                console.error("Unexpected error fetching hero media:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHeroMedia();
    }, []);

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
                {loading ? (
                    <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[#c75e33] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : mediaUrl ? (
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
                            <img
                                src={mediaUrl}
                                alt="Learning at home"
                                className="w-full h-full object-cover"
                            />
                        )}
                        {/* Consistent dark transparent overlay covering the entire image to match reference */}
                        <div className="absolute inset-0 bg-black/30 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#17242e] via-[#17242e]/80 to-transparent w-full md:w-2/3"></div>
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
                    <div className="w-full lg:w-[65%] flex flex-col items-start text-left mt-24 lg:mt-32">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-extrabold text-white leading-[1.1] mb-6 animate-fade-in-up tracking-tight" style={{ animationDelay: '0.1s' }}>
                            {renderTitle(title)}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed animate-fade-in-up drop-shadow-sm max-w-2xl font-normal" style={{ animationDelay: '0.2s' }}>
                            {renderSubtitle(subtitle)}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-fade-in-up mb-14" style={{ animationDelay: '0.3s' }}>
                            <button
                                onClick={() => navigate('/class/1')}
                                className="px-8 py-3.5 bg-[#b35a2e] hover:bg-[#c75e33] text-white font-bold rounded-xl outline-none transition-all shadow-lg w-full sm:w-auto text-center"
                            >
                                Explore Classes
                            </button>
                            <button
                                onClick={() => document.getElementById('mentors')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md font-bold rounded-xl transition-all shadow-md border border-white/20 hover:border-white/30 w-full sm:w-auto text-center"
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
