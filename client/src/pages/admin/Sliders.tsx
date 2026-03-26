import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaSave, FaUpload } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface HeroMedia {
    id: string;
    type: 'image' | 'video' | 'text';
    media_url: string;
    is_active: boolean;
}

const Sliders: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [heroData, setHeroData] = useState<HeroMedia | null>(null);

    const [form, setForm] = useState<{ media_url: string; type: 'image' | 'video' | 'text'; title: string; subtitle: string; titleColor: string }>({
        media_url: '',
        type: 'image',
        title: 'Helping Young Minds Grow with *Confidence*',
        subtitle: 'Structured subject roadmaps, qualified home tutors, and\npersonalized learning for students from Class 1 to 10 —\nall at the comfort of your home.',
        titleColor: '#c75e33'
    });

    const fetchHeroMedia = async () => {
        setLoading(true);
        try {
            // Fetch the active hero media using the sliders table
            const { data, error } = await supabase
                .from('sliders')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                let parsedTitle = data.title || 'Helping Young Minds Grow with *Confidence*';
                let parsedColor = '#c75e33';

                if (parsedTitle.includes('|||')) {
                    const parts = parsedTitle.split('|||');
                    parsedTitle = parts[0];
                    parsedColor = parts[1];
                }

                setHeroData(data as HeroMedia);
                setForm({
                    media_url: data.media_url || '',
                    type: (data.type as any) || 'image',
                    title: parsedTitle,
                    subtitle: data.subtitle || 'Structured subject roadmaps, qualified home tutors, and\npersonalized learning for students from Class 1 to 10 —\nall at the comfort of your home.',
                    titleColor: parsedColor
                });
            }
        } catch (err) {
            console.error('Error fetching hero media:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeroMedia();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const publicUrl = await uploadFile(file, 'uploads', 'sliders');

            // Auto-detect type
            let type: 'image' | 'video' | 'text' = 'text';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';

            setForm(prev => ({ ...prev, media_url: publicUrl, type }));
        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            alert('Upload Error: ' + errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSave = {
                title: `${form.title}|||${form.titleColor}`,
                subtitle: form.subtitle,
                type: form.type,
                media_url: form.media_url,
                is_active: true,
                display_order: 0
            };

            if (heroData && heroData.id) {
                const { error } = await supabase
                    .from('sliders')
                    .update(dataToSave)
                    .eq('id', heroData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('sliders')
                    .insert([dataToSave]);
                if (error) throw error;
            }

            alert('Hero Section saved successfully!');
            fetchHeroMedia();
        } catch (err) {
            console.error('Error saving hero media:', err);
            alert('Failed to save Hero Section');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Hero Section Master</h1>
                <p className="text-sm text-gray-500 font-medium">Control the first impression of your platform.</p>
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-50">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center">
                                <FaUpload size={14} />
                            </div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atmospheric Media</label>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 items-center">
                                <label className="cursor-pointer bg-[#ffb76c] hover:bg-[#ffa94d] text-[#1B2A5A] font-black py-3 rounded-xl text-center transition flex items-center justify-center gap-2 shadow-lg shadow-orange-100/50 text-xs">
                                    <FaUpload size={12} /> {uploading ? 'Processing...' : 'Upload Asset'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Direct Asset URL"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-medium text-sm pr-10"
                                        value={form.media_url}
                                        onChange={e => setForm({ ...form, media_url: e.target.value })}
                                    />
                                </div>
                            </div>

                            {form.media_url && form.media_url.includes('drive.google.com') && (
                                <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                    <p className="text-[10px] text-red-600 font-black uppercase tracking-tighter">
                                        Google Drive links restricted. Host assets directly.
                                    </p>
                                </div>
                            )}

                            {form.media_url && (
                                <div className="mt-2 h-[220px] w-full bg-gray-900 rounded-2xl overflow-hidden relative border-4 border-white shadow-2xl flex items-center justify-center group-hover:scale-[1.01] transition-transform">
                                    {form.type === 'video' ? (
                                        <video src={form.media_url} autoPlay loop muted className="h-full w-full object-cover" />
                                    ) : (
                                        <img src={form.media_url} alt="Preview" className="h-full w-full object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                                    <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase border border-white/20">
                                        Live Preview
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-[#1B2A5A] ml-1">Hero Title</label>
                                <textarea
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all min-h-[100px] font-black text-gray-900 text-sm"
                                    placeholder="Enter hero title..."
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                                <p className="text-[9px] text-gray-400 font-medium px-1 leading-relaxed italic">
                                    *Keyword* = Dynamic underline style.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-[#1B2A5A] ml-1">Accent Calibration</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            className="h-10 w-16 border-2 border-gray-100 rounded-xl cursor-pointer bg-white"
                                            value={form.titleColor}
                                            onChange={e => setForm({ ...form, titleColor: e.target.value })}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        className="bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-2 rounded-xl transition-all w-24 uppercase text-xs font-black tracking-widest text-[#a0522d]"
                                        value={form.titleColor}
                                        onChange={e => setForm({ ...form, titleColor: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Meta Description (Subtitle)</label>
                            <textarea
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all min-h-[185px] font-medium text-gray-600 text-sm leading-relaxed"
                                placeholder="Enter hero subtitle..."
                                value={form.subtitle}
                                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || uploading || !form.media_url}
                            className="bg-[#1B2A5A] text-white py-3.5 px-10 font-black rounded-xl hover:bg-[#142044] disabled:opacity-50 transition shadow-xl shadow-[#1B2A5A]/10 text-xs flex items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <FaSave size={12} /> Commit Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Sliders;
