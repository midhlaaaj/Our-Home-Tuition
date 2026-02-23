import React, { useEffect, useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { supabase } from '../supabaseClient';
import type { Swiper as SwiperType } from 'swiper';
// Swiper styles
import 'swiper/swiper-bundle.css';

interface Partner {
    id: string;
    media_url: string;
    display_order: number;
}

const PartnerSlider: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const swiperRef = useRef<SwiperType | null>(null);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const { data, error } = await supabase
                    .from('partners')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (error) throw error;
                setPartners(data || []);
            } catch (err) {
                console.error('Error fetching partners:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, []);

    if (loading || partners.length === 0) return null;

    return (
        <section className="w-full bg-gray-50 py-12 overflow-hidden relative">
            {/* Prev Button */}
            <button
                ref={prevRef}
                onClick={() => swiperRef.current?.slidePrev()}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#ffb76c] hover:text-white hover:border-[#ffb76c] transition-all"
                aria-label="Previous slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            {/* Next Button */}
            <button
                ref={nextRef}
                onClick={() => swiperRef.current?.slideNext()}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#ffb76c] hover:text-white hover:border-[#ffb76c] transition-all"
                aria-label="Next slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>

            <div className="px-12">
                <Swiper
                    onSwiper={(swiper) => { swiperRef.current = swiper; }}
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
                        el: '.partner-pagination',
                    }}
                    breakpoints={{
                        0: { slidesPerView: 1, spaceBetween: 12 },
                        640: { slidesPerView: 2, spaceBetween: 16 },
                        1024: { slidesPerView: 3, spaceBetween: 20 },
                    }}
                    className="w-full"
                >
                    {partners.map((partner) => (
                        <SwiperSlide key={partner.id}>
                            <div className="w-full aspect-video overflow-hidden rounded-xl shadow-sm">
                                <img
                                    src={partner.media_url}
                                    alt="Partner"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Pagination Dots */}
            <div className="partner-pagination flex justify-center gap-2 mt-6 [&>.swiper-pagination-bullet]:w-2.5 [&>.swiper-pagination-bullet]:h-2.5 [&>.swiper-pagination-bullet]:rounded-full [&>.swiper-pagination-bullet]:bg-gray-300 [&>.swiper-pagination-bullet-active]:bg-[#c75e33] [&>.swiper-pagination-bullet]:transition-all [&>.swiper-pagination-bullet-active]:w-6" />
        </section>
    );
};

export default PartnerSlider;
