import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaImage, FaLink, FaUser } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

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

const AdminBlogs: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Partial<Blog>>({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blogs:', error);
        } else {
            setBlogs(data || []);
        }
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'author_image') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadFile(file, 'uploads', 'blogs', supabase);
            if (url) {
                setEditingBlog(prev => ({ ...prev, [field]: url }));
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingBlog.title || !editingBlog.content || !editingBlog.slug) {
            alert("Please fill in the title, slug, and content.");
            return;
        }

        const blogData = {
            title: editingBlog.title,
            slug: editingBlog.slug,
            content: editingBlog.content,
            excerpt: editingBlog.excerpt || '',
            category: editingBlog.category || 'General',
            image_url: editingBlog.image_url || '',
            author_name: editingBlog.author_name || 'Admin',
            author_image: editingBlog.author_image || '',
            updated_at: new Date().toISOString()
        };

        if (editingBlog.id) {
            const { error } = await supabase
                .from('blogs')
                .update(blogData)
                .eq('id', editingBlog.id);

            if (error) {
                console.error("Error updating blog:", error);
                alert(`Error: ${error.message}`);
            }
        } else {
            const { error } = await supabase
                .from('blogs')
                .insert([blogData]);

            if (error) {
                console.error("Error adding blog:", error);
                alert(`Error: ${error.message}`);
            }
        }

        setIsEditing(false);
        setEditingBlog({});
        fetchBlogs();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this blog post?")) return;

        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting blog:", error);
        } else {
            fetchBlogs();
        }
    };


    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Blog Repository</h1>
                    <p className="text-sm font-bold text-[#1B2A5A] mt-1">Manage educational insights and company stories</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#a0522d] text-white px-5 py-2.5 rounded-xl font-black hover:bg-[#804224] transition-all flex items-center gap-2.5 shadow-xl shadow-[#a0522d]/10 group text-[11px] uppercase tracking-widest"
                    >
                        <FaPlus size={10} />
                        Draft New Story
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-gray-50 mb-8 animate-in slide-in-from-top-4 duration-500">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px]">Title</label>
                                    <input
                                        type="text"
                                        value={editingBlog.title || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setEditingBlog({ 
                                                ...editingBlog, 
                                                title: val,
                                                slug: editingBlog.id ? editingBlog.slug : generateSlug(val)
                                            });
                                        }}
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-3 rounded-xl transition-all font-bold text-sm"
                                        placeholder="Enter catchy title..."
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px]">Slug (URL Path)</label>
                                    <div className="relative">
                                        <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                                        <input
                                            type="text"
                                            value={editingBlog.slug || ''}
                                            onChange={(e) => setEditingBlog({ ...editingBlog, slug: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none pl-10 pr-4 py-3 rounded-xl transition-all font-bold text-sm"
                                            placeholder="my-cool-blog..."
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px]">Category</label>
                                        <input
                                            type="text"
                                            value={editingBlog.category || ''}
                                            onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest text-blue-900"
                                            placeholder="e.g. Tips"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px]">Author Name</label>
                                        <input
                                            type="text"
                                            value={editingBlog.author_name || ''}
                                            onChange={(e) => setEditingBlog({ ...editingBlog, author_name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-3 rounded-xl transition-all font-bold text-sm"
                                            placeholder="Admin Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5 text-center">
                                    <label className="block text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px] text-left">Cover Image</label>
                                    <div className="relative group aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden hover:border-[#a0522d] transition-all">
                                        {editingBlog.image_url ? (
                                            <img src={editingBlog.image_url} alt="Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <FaImage size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Select Visual</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(e, 'image_url')}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-[#a0522d] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px]">Excerpt (Brief Summary)</label>
                                    <textarea
                                        value={editingBlog.excerpt || ''}
                                        onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-4 py-3 rounded-xl transition-all font-medium text-sm h-20 resize-none"
                                        placeholder="A short hook for the card..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-bold text-[#1B2A5A] ml-1 uppercase tracking-widest text-[10px]">Content (Full Story)</label>
                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase border border-emerald-100/50">
                                    Markdown Supported
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded text-center">## Header</span>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded text-center">**Bold**</span>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded text-center"> &gt; Quote</span>
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded text-center">- List</span>
                            </div>
                            <textarea
                                value={editingBlog.content || ''}
                                onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 focus:border-[#a0522d] focus:bg-white outline-none px-6 py-5 rounded-[24px] transition-all font-medium text-base h-80 leading-relaxed"
                                placeholder="Write your educational insight here..."
                                required
                            />
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setEditingBlog({}); }}
                                className="bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                            >
                                <FaTimes size={10} /> Discard Draft
                            </button>
                            <div className="flex-1"></div>
                            <button
                                type="submit"
                                className="bg-[#1B2A5A] text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#142044] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10"
                                disabled={uploading}
                            >
                                <FaSave size={12} /> Publish Story
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {loading && blogs.length === 0 ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-50 animate-pulse">
                                <div className="aspect-video bg-gray-100"></div>
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-gray-100 rounded-lg w-3/4"></div>
                                    <div className="h-4 bg-gray-50 rounded-lg w-1/2"></div>
                                    <div className="h-3 bg-gray-50 rounded-lg w-1/4"></div>
                                </div>
                            </div>
                        ))
                    ) : blogs.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-[40px] text-center border-2 border-dashed border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaPlus size={24} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Story Library Empty</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Draft your first educational insight above.</p>
                        </div>
                    ) : (
                        blogs.map((blog) => (
                            <div key={blog.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50 group hover:shadow-xl transition-all duration-500 flex flex-col">
                                <div className="relative h-40 overflow-hidden bg-gray-100">
                                    {blog.image_url ? (
                                        <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200"><FaImage size={32} /></div>
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => { setEditingBlog(blog); setIsEditing(true); }}
                                            className="w-8 h-8 rounded-lg bg-white/90 text-blue-600 hover:bg-white shadow-sm flex items-center justify-center"
                                        >
                                            <FaEdit size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(blog.id)}
                                            className="w-8 h-8 rounded-lg bg-red-500/90 text-white hover:bg-red-500 shadow-sm flex items-center justify-center"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-[#1B2A5A] text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                            {blog.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight line-clamp-2">{blog.title}</h3>
                                    <p className="text-xs text-gray-400 font-bold mb-4 flex items-center gap-2">
                                        {new Date(blog.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <FaUser size={10} className="text-[#a0522d]/60" />
                                        {blog.author_name}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminBlogs;
