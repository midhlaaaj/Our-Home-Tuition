"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';

interface Brand {
    id: string; // Supabase uses string UUIDs usually, or numbers
    name: string;
    logo_url: string;
    row_category: 'upper' | 'lower';
}

const AffiliatedLogos: React.FC = () => {
    const [upperLogos, setUpperLogos] = useState<Brand[]>([]);
    const [lowerLogos, setLowerLogos] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);

    const initialized = React.useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const fetchBrands = async () => {
            try {
                const result = await safeFetch(async () => {
                    return await supabase
                        .from('brands')
                        .select('*')
                        .eq('is_active', true);
                }, { requestId: 'Brands' });

                const { data, error } = result;

                if (error) throw error;

                if (data) {
                    setUpperLogos(data.filter((b: Brand) => b.row_category === 'upper'));
                    setLowerLogos(data.filter((b: Brand) => b.row_category === 'lower'));
                }
            } catch (err) {
                console.error('Error fetching affiliated logos:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    if (loading) return null; // Or a skeleton loader if preferred

    // If no logos, don't render section to avoid empty space
    if (upperLogos.length === 0 && lowerLogos.length === 0) return null;

    return (
        <div className="w-full bg-white py-8 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-12 font-['Urbanist']">
                Our Affiliations
            </h2>

            <div className="flex flex-col gap-10">
                {/* Upper Row - Scrolls Left */}
                {upperLogos.length > 0 && (
                    <div className="relative w-full overflow-hidden">
                        <div
                            className="flex items-center gap-16 animate-scroll-left min-w-max"
                            style={{ animation: 'scrollLeft 60s linear infinite' }}
                        >
                            {/* Duplicate the list for seamless loop - Set 1 */}
                            {upperLogos.map((logo, index) => (
                                <img
                                    key={`1-${logo.id}-${index}`}
                                    src={logo.logo_url}
                                    alt={logo.name}
                                    className="h-4 md:h-5 mx-8 object-contain flex-shrink-0"
                                    loading="lazy"
                                />
                            ))}
                            {/* Set 2 */}
                            {upperLogos.map((logo, index) => (
                                <img
                                    key={`2-${logo.id}-${index}`}
                                    src={logo.logo_url}
                                    alt={logo.name}
                                    className="h-4 md:h-5 mx-8 object-contain flex-shrink-0"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Lower Row - Scrolls Right */}
                {lowerLogos.length > 0 && (
                    <div className="relative w-full overflow-hidden">
                        <div
                            className="flex items-center gap-16 animate-scroll-right min-w-max"
                            style={{ animation: 'scrollRight 60s linear infinite' }}
                        >
                            {/* Duplicate the list for seamless loop - Set 1 */}
                            {lowerLogos.map((logo, index) => (
                                <img
                                    key={`1-${logo.id}-${index}`}
                                    src={logo.logo_url}
                                    alt={logo.name}
                                    className="h-4 md:h-5 mx-8 object-contain flex-shrink-0"
                                    loading="lazy"
                                />
                            ))}
                            {/* Set 2 */}
                            {lowerLogos.map((logo, index) => (
                                <img
                                    key={`2-${logo.id}-${index}`}
                                    src={logo.logo_url}
                                    alt={logo.name}
                                    className="h-4 md:h-5 mx-8 object-contain flex-shrink-0"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AffiliatedLogos;
