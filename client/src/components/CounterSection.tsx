"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { safeFetch } from '../utils/supabaseUtils';
import { useInView } from 'framer-motion';

interface Counter {
    id: string;
    label: string;
    value: number;
    suffix: string;
    display_order: number;
    is_active?: boolean;
}

const CounterItem: React.FC<{ counter: Counter }> = ({ counter }) => {
    const [count, setCount] = useState(1);
    const ref = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const animate = (target: number) => {
        // Cancel any existing animation frame to restart smoothly
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        const start = 1;
        const end = target;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart for smooth finish
            const easeProgress = 1 - Math.pow(1 - progress, 4);

            // Calculate current value
            const currentCount = Math.floor(start + (end - start) * easeProgress);
            setCount(currentCount);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(step);
            } else {
                setCount(end); // Ensure we land exactly on target
            }
        };

        requestRef.current = requestAnimationFrame(step);
    };

    // Initial animation on scroll into view
    useEffect(() => {
        if (isInView) {
            animate(counter.value);
        }
        // Cleanup on unmount
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isInView, counter.value]);

    const handleMouseEnter = () => {
        // Re-trigger animation on hover
        animate(counter.value);
    };

    return (
        <div
            ref={ref}
            onMouseEnter={handleMouseEnter}
            className="flex flex-col items-center justify-center p-3 text-center cursor-pointer rounded-lg"
        >
            <div className="flex items-baseline justify-center space-x-1">
                <span className="text-2xl md:text-3xl font-bold text-[#ffb76c]">
                    {count}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-white">
                    {counter.suffix}
                </span>
            </div>
            <p className="text-white text-xs md:text-sm font-medium mt-1 uppercase tracking-wider opacity-90">
                {counter.label}
            </p>
        </div>
    );
};

const CounterSection: React.FC = () => {
    const [counters, setCounters] = useState<Counter[]>([]);
    const [loading, setLoading] = useState(true);

    const defaultCounters: Counter[] = [
        { id: '1', label: 'Students Assisted', value: 25, suffix: 'K+', display_order: 1, is_active: true },
        { id: '2', label: 'Years of Combined Experience', value: 30, suffix: '+', display_order: 2, is_active: true },
        { id: '3', label: 'Industry Experts', value: 100, suffix: '+', display_order: 3, is_active: true },
        { id: '4', label: 'Universities', value: 500, suffix: '+', display_order: 4, is_active: true },
    ];

    const initialized = React.useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const fetchCounters = async () => {
            // We removed the aggressive 10s timeout to allow Supabase more time to respond.

            try {
                const result = await safeFetch(async () => {
                    return await supabase
                        .from('counters')
                        .select('*')
                        .eq('is_active', true)
                        .order('display_order', { ascending: true });
                }, { requestId: 'Counters' });

                const { data, error } = result;

                if (error) throw error;

                if (data && data.length > 0) {
                    setCounters(data);
                } else {
                    setCounters(defaultCounters);
                }
            } catch (error) {
                console.error('Error fetching counters:', error);
                setCounters(defaultCounters);
            } finally {
                setLoading(false);
            }
        };

        fetchCounters();
    }, []);

    if (loading) return null;

    return (
        <section className="w-full bg-gray-200 py-8">
            <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="bg-[#1F2937] rounded-2xl overflow-hidden shadow-lg py-2 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-700">
                        {counters.map((counter) => (
                            <CounterItem key={counter.id} counter={counter} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CounterSection;
