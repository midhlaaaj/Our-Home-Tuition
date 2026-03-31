"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { supabase } from '../supabaseClient';
import { FaCalendarAlt, FaUser, FaArrowRight } from 'react-icons/fa';

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    image_url: string;
    author_name: string;
    author_image: string;
    created_at: string;
}

const Blogs: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                setBlogs(data || []);
            } catch (error) {
                console.error('Error fetching blogs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-['Urbanist']">
            <Header />

            <main className="flex-grow pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-24">
                    
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center">
                        <Reveal delay={0.2}>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#17242e] tracking-tight mb-8">
                                Our <span className="text-[#a0522d]">Latest</span> Stories
                            </h1>
                            <p className="text-lg md:text-xl text-gray-400 font-medium max-w-3xl leading-relaxed mb-20 mx-auto">
                                Dive into a collection of expert pedagogical insights, student success stories, and practical learning strategies 
                                designed to nurture academic excellence. Whether you're a parent seeking guidance or a student looking for motivation, 
                                discover the narratives that shape our commitment to quality education.
                            </p>
                        </Reveal>
                    </div>

                    {/* Blogs Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-[32px] aspect-[4/5] animate-pulse border border-gray-100 shadow-sm"></div>
                            ))}
                        </div>
                    ) : blogs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {blogs.map((blog) => (
                                <Reveal key={blog.id}>
                                    <Link href={`/blogs/${blog.slug}`} className="group block h-full">
                                        <div className="bg-white rounded-[40px] overflow-hidden border border-gray-100/50 hover:border-gray-200 transition-all duration-500 h-full flex flex-col hover:shadow-2xl hover:shadow-gray-200/50">
                                            {/* Image Container */}
                                            <div className="relative h-64 overflow-hidden">
                                                <img 
                                                    src={blog.image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                                                    alt={blog.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-6 left-6">
                                                    <span className="bg-[#1B2A5A] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                                                        {blog.category || 'Expertise'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-8 flex-grow flex flex-col">
                                                <div className="flex items-center gap-4 text-gray-400 text-[11px] font-black uppercase tracking-widest mb-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <FaCalendarAlt size={10} className="text-[#a0522d]/60" />
                                                        {new Date(blog.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                    <div className="flex items-center gap-1.5">
                                                        <FaUser size={10} className="text-[#a0522d]/60" />
                                                        {blog.author_name || 'Admin'}
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-black text-[#17242e] mb-4 leading-tight group-hover:text-[#a0522d] transition-colors line-clamp-2">
                                                    {blog.title}
                                                </h3>
                                                
                                                <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                                                    {blog.excerpt || 'Explore our comprehensive guide on how personalized tuition can transform student performance and academic confidence.'}
                                                </p>

                                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <span className="text-[12px] font-black text-[#1B2A5A] uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                                                        Read Story <FaArrowRight />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </Reveal>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white rounded-none border-2 border-dashed border-gray-100">
                            <h3 className="text-2xl font-black text-gray-300">New stories coming soon...</h3>
                            <button onClick={() => window.location.reload()} className="mt-6 text-[#a0522d] font-black uppercase tracking-widest text-xs hover:underline">
                                Refresh Feed
                            </button>
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Blogs;
