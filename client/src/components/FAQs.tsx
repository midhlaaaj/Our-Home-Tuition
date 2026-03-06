import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order: number;
}

const FAQs: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .order('order', { ascending: true });

            if (error) {
                console.error('Error fetching FAQs:', error);
            } else {
                setFaqs(data || []);
            }
        };

        fetchFaqs();
    }, []);

    const toggleFaq = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    if (faqs.length === 0) return null;

    return (
        <section className="pt-12 pb-8 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 font-['Urbanist'] tracking-tight">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;

                        return (
                            <div
                                key={faq.id}
                                className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <button
                                    className="w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none"
                                    onClick={() => toggleFaq(faq.id)}
                                >
                                    <span className="text-base font-semibold transition-colors duration-200 text-gray-800">
                                        {faq.question}
                                    </span>
                                    <span className="text-gray-800 ml-4 flex-shrink-0 transition-transform duration-300 ease-in-out">
                                        {isOpen ? <FaMinus size={14} /> : <FaPlus size={14} />}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        >
                                            <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FAQs;
