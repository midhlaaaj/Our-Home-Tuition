import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { supabase } from '../supabaseClient';
import { FaCalendarAlt, FaChevronLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Blog {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    category: string;
    image_url: string;
    author_name: string;
    author_image: string;
    created_at: string;
}
const BlogDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .eq('slug', slug)
                    .single();
                
                if (error) throw error;
                setBlog(data);
            } catch (error) {
                console.error('Error fetching blog:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchBlog();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Urbanist']">
                <div className="w-16 h-16 border-4 border-[#1B2A5A]/10 border-t-[#1B2A5A] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Urbanist']">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-[#17242e] mb-4">Blog not found</h2>
                    <Link to="/blogs" className="text-[#a0522d] font-black uppercase tracking-widest text-xs">Back to all blogs</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-['Urbanist']">
            <Header />

            <main className="flex-grow pt-32 pb-20">
                <article className="max-w-4xl mx-auto px-6">
                    
                    {/* Breadcrumbs & Actions */}
                    <div className="flex justify-between items-center mb-12">
                        <Link to="/blogs" className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-[#a0522d] transition-colors">
                            <FaChevronLeft /> Back to Blogs
                        </Link>
                    </div>

                    {/* Metadata */}
                    <Reveal>
                        <div className="mb-12">
                            <span className="inline-block bg-[#1B2A5A]/5 text-[#1B2A5A] text-[10px] font-black px-6 py-2.5 rounded-full uppercase tracking-widest mb-6 border border-[#1B2A5A]/10">
                                {blog.category || 'Education'}
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#17242e] mb-8 leading-[1.1]">
                                {blog.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-8 text-gray-400 text-[11px] font-black uppercase tracking-widest border-y border-gray-50 py-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-50">
                                        {blog.author_image ? (
                                            <img src={blog.author_image} alt={blog.author_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#1B2A5A] text-white">
                                                {blog.author_name?.charAt(0) || 'A'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[#17242e]">{blog.author_name || 'Our Home Tuition'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaCalendarAlt className="text-[#a0522d]/40" />
                                    <span>{new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-gray-300">5 min read</span>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Hero Image */}
                    <Reveal>
                        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-none overflow-hidden mb-16 border border-gray-100/50 hover:border-gray-200 transition-all duration-700 bg-gray-50">
                            <img 
                                src={blog.image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'} 
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                    </Reveal>

                    {/* Content Section */}
                    <Reveal>
                        <div className="max-w-3xl mx-auto urbanist-content">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({node, children, ...props}) => {
                                        // Special formatting for first paragraph for the "Drop Cap" effect
                                        const isFirst = node?.position?.start.line === 1;
                                        return (
                                            <p 
                                                className={`text-lg md:text-xl text-gray-700 leading-[1.8] mb-10 selection:bg-[#a0522d]/10 font-medium ${
                                                    isFirst ? 'first-letter:text-6xl first-letter:font-extrabold first-letter:text-[#a0522d] first-letter:mr-0 first-letter:-ml-1' : ''
                                                }`}
                                                {...props}
                                            >
                                                {children}
                                            </p>
                                        );
                                    },
                                    h2: ({children}) => <h2 className="text-3xl font-black text-[#17242e] mt-16 mb-8 tracking-tight">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-2xl font-black text-[#17242e] mt-12 mb-6 tracking-tight">{children}</h3>,
                                    ul: ({children}) => <ul className="list-disc pl-6 mb-10 space-y-4 text-gray-600 font-medium">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal pl-6 mb-10 space-y-4 text-gray-600 font-medium">{children}</ol>,
                                    li: ({children}) => <li className="pl-2">{children}</li>,
                                    blockquote: ({children}) => (
                                        <blockquote className="border-l-4 border-[#a0522d] pl-8 py-4 my-12 bg-gray-50/50 italic text-xl text-gray-600 font-medium leading-relaxed">
                                            {children}
                                        </blockquote>
                                    ),
                                    strong: ({children}) => <strong className="font-black text-[#17242e]">{children}</strong>,
                                    a: ({children, href}) => (
                                        <a href={href} className="text-[#a0522d] font-bold underline hover:text-[#1B2A5A] transition-colors">
                                            {children}
                                        </a>
                                    )
                                }}
                            >
                                {blog.content?.trim()}
                            </ReactMarkdown>
                        </div>
                    </Reveal>

                </article>
            </main>

            <Footer />
        </div>
    );
};

export default BlogDetail;
