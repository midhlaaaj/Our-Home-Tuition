import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FiTarget, FiEye } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import { useRef } from 'react';

import { supabase } from '../supabaseClient';
import Reveal from '../components/Reveal';

interface Achievement {
    id: string;
    icon: string;
    display_order: number;
}

const About: React.FC = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [activeFounderIndex, setActiveFounderIndex] = useState(0);

    const prevAchRef = useRef<HTMLButtonElement>(null);
    const nextAchRef = useRef<HTMLButtonElement>(null);
    const swiperAchRef = useRef<SwiperType | null>(null);

    const founders = [
        {
            role: 'CEO',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        },
        {
            role: 'CFO',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        },
        {
            role: 'CTO',
            image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFounderIndex((prev) => (prev + 1) % founders.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [founders.length]);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const { data, error } = await supabase
                    .from('achievements')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });
                if (error) throw error;
                setAchievements(data || []);
            } catch (error) {
                console.error('Failed to fetch achievements:', error);
            }
        };

        fetchAchievements();
    }, []);

    return (
        <div className="font-['Urbanist'] bg-gray-50 min-h-screen relative overflow-hidden">
            <Header />

            {/* Decorative Background Elements */}
            <div className="absolute top-40 left-10 w-64 h-64 bg-[#c75e33]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <main className="pt-32 pb-6 px-6 sm:px-10 lg:px-24 max-w-7xl mx-auto relative z-10 space-y-24">

                {/* Introduction Section */}
                <Reveal>
                    <section className="text-center max-w-4xl mx-auto space-y-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#17242e] tracking-tight">
                            About Hour Home
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
                            We connect qualified mentors with students from Class 1 to Class 10, bringing personalized home tuition directly to you. Whether for individual attention or small group sessions, we ensure a comfortable, focused learning environment right at home. Beyond academics, our platform is dedicated to creating meaningful employment opportunities for qualified mentors, bridging the unemployment gap while delivering quality education.
                        </p>
                    </section>
                </Reveal>

                {/* Vision and Mission Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vision Card */}
                    <Reveal direction="left">
                        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group h-full">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#c75e33]/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="w-16 h-16 bg-[#c75e33]/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                                <FiEye className="w-8 h-8 text-[#c75e33]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#17242e] mb-4 relative z-10">Our Vision</h2>
                            <p className="text-gray-600 leading-relaxed relative z-10">
                                To build a reliable and accessible education platform where every student can receive personalized learning support, and every qualified mentor can find meaningful, flexible teaching opportunities that empower them.
                            </p>
                        </div>
                    </Reveal>

                    {/* Mission Card */}
                    <Reveal direction="right">
                        <div className="bg-[#17242e] rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group h-full">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                                <FiTarget className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Our Mission</h2>
                            <p className="text-gray-300 leading-relaxed relative z-10">
                                To seamlessly connect students and parents with skilled tutors, providing structured home-based education that improves academic confidence while offering mentors rewarding and flexible employment opportunities.
                            </p>
                        </div>
                    </Reveal>
                </section>

                {/* Founders Section */}
                <Reveal>
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:min-h-[80vh] flex">
                        <div className="flex flex-col lg:flex-row w-full">
                            {/* Scrollable Image Carousel */}
                            <div className="h-80 sm:h-[450px] lg:h-auto lg:min-h-full lg:w-2/5 relative bg-gray-200 group overflow-hidden shrink-0">
                                <div className="flex absolute inset-0 transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${activeFounderIndex * 100}%)` }}>
                                    {founders.map((founder, index) => (
                                        <div key={index} className="w-full h-full flex-shrink-0 relative">
                                            <img
                                                src={founder.image}
                                                alt={founder.role}
                                                className="w-full h-full object-cover object-top"
                                            />
                                            <div className="absolute top-4 left-4 bg-[#c75e33] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-md uppercase">
                                                {founder.role}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Dotted Indicators */}
                                <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
                                    {founders.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveFounderIndex(idx)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeFounderIndex === idx ? 'bg-[#c75e33] w-6' : 'bg-white/60 hover:bg-white'} shadow-sm`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="p-6 lg:p-10 flex flex-col justify-start lg:w-3/5">
                                <div className="inline-block px-4 py-1.5 bg-[#c75e33]/10 rounded-full text-[#c75e33] font-bold text-sm mb-4 w-max uppercase tracking-wide">Leadership Team</div>
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-[#17242e] mb-4">Meet the Founders</h2>
                                <p className="text-gray-600 leading-relaxed text-base mb-4">
                                    "Our motivation stems from a dual purpose: to elevate the quality of education accessible to students, and to provide a platform where talented educators can thrive. Too often, bright minds are left without guidance, and qualified teachers without opportunities."
                                </p>
                                <p className="text-gray-600 leading-relaxed text-base">
                                    "We built this platform to bridge that gap. By bringing structured learning into the comfort of students' homes, we ensure that every child receives the academic attention they deserve, while empowering mentors to build fulfilling careers on their own terms."
                                </p>
                            </div>
                        </div>
                    </section>
                </Reveal>

                {/* Approach Section */}
                <Reveal>
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:min-h-[80vh] flex">
                        <div className="flex flex-col lg:flex-row w-full">
                            <div className="p-6 lg:p-10 flex flex-col justify-start order-2 lg:w-3/5 lg:order-1">
                                <div className="inline-block px-4 py-1.5 bg-blue-500/10 rounded-full text-blue-600 font-bold text-sm mb-4 w-max uppercase tracking-wide">Methodology</div>
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-[#17242e] mb-4">Our Approach to Learning</h2>
                                <p className="text-gray-600 leading-relaxed text-base mb-4">
                                    We believe that no two students learn exactly the same way. That's why our core approach focuses on high personalization, flexible scheduling, and direct mentor-student interaction.
                                </p>
                                <p className="text-gray-600 leading-relaxed text-base">
                                    Whether through one-on-one individual attention or highly focused small group sessions, our structured subject-wise learning roadmaps are designed to clarify complex concepts, build strong academic foundations, and instill a lasting confidence in every student.
                                </p>
                            </div>
                            <div className="h-64 lg:h-auto lg:min-h-full lg:w-2/5 relative bg-gray-200 order-1 lg:order-2 shrink-0">
                                {/* Placeholder for Approach Image */}
                                <img
                                    src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="Learning Approach"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </section>
                </Reveal>

            </main>

            {/* Achievements Section — Full Width */}
            {achievements.length > 0 && (
                <Reveal>
                    <section className="py-16 relative overflow-hidden bg-gray-50">
                        <div className="text-center mb-12 relative z-10">
                            <h2 className="text-3xl font-extrabold text-[#17242e] mb-4">Our Milestones</h2>
                            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                                The journey so far in numbers. Empowering education, one session at a time.
                            </p>
                        </div>

                        {/* Prev Button */}
                        <button
                            ref={prevAchRef}
                            onClick={() => swiperAchRef.current?.slidePrev()}
                            className="absolute left-2 md:left-6 top-[60%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#1B2A5A] hover:text-white hover:border-[#1B2A5A] transition-all"
                            aria-label="Previous slide"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        {/* Next Button */}
                        <button
                            ref={nextAchRef}
                            onClick={() => swiperAchRef.current?.slideNext()}
                            className="absolute right-2 md:right-6 top-[60%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#1B2A5A] hover:text-white hover:border-[#1B2A5A] transition-all"
                            aria-label="Next slide"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>

                        <div className="px-14 md:px-20 relative z-10">
                            <Swiper
                                onSwiper={(swiper) => { swiperAchRef.current = swiper; }}
                                modules={[Autoplay, Pagination, Navigation]}
                                slidesPerView={3}
                                spaceBetween={20}
                                loop={true}
                                autoplay={{
                                    delay: 4000,
                                    disableOnInteraction: false,
                                }}
                                speed={800}
                                pagination={{
                                    clickable: true,
                                    el: '.achievement-pagination',
                                }}
                                breakpoints={{
                                    0: { slidesPerView: 1, spaceBetween: 12 },
                                    640: { slidesPerView: 2, spaceBetween: 16 },
                                    1024: { slidesPerView: 3, spaceBetween: 20 },
                                }}
                                className="w-full"
                            >
                                {achievements.map((achievement) => (
                                    <SwiperSlide key={achievement.id}>
                                        <div className="w-full aspect-video overflow-hidden rounded-xl shadow-sm">
                                            <img
                                                src={achievement.icon}
                                                alt="Achievement"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>

                        {/* Pagination Dots */}
                        <div className="achievement-pagination relative z-10 flex justify-center gap-2 mt-6 [&>.swiper-pagination-bullet]:w-2.5 [&>.swiper-pagination-bullet]:h-2.5 [&>.swiper-pagination-bullet]:rounded-full [&>.swiper-pagination-bullet]:bg-gray-300 [&>.swiper-pagination-bullet-active]:bg-[#1B2A5A] [&>.swiper-pagination-bullet]:transition-all [&>.swiper-pagination-bullet-active]:w-6" />
                    </section>
                </Reveal>
            )}

            <Footer />
        </div>
    );
};

export default About;
