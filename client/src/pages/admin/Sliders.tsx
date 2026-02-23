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

    const [form, setForm] = useState<{ media_url: string; type: 'image' | 'video' | 'text' }>({
        media_url: '',
        type: 'image'
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
                setHeroData(data as HeroMedia);
                setForm({
                    media_url: data.media_url || '',
                    type: (data.type as any) || 'image'
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
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file. Make sure the "uploads" bucket exists and is public.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSave = {
                title: 'Hero Section',
                subtitle: '',
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
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Hero Section</h1>
                <p className="text-gray-500 mt-2">Upload the main background image or video for the homepage.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Background Media</label>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 items-center">
                                <label className="cursor-pointer bg-[#ffb76c] hover:bg-[#ffa94d] text-gray-900 font-semibold py-3 px-6 rounded-lg text-center transition flex items-center justify-center gap-2 shadow-sm min-w-[200px]">
                                    <FaUpload /> {uploading ? 'Uploading...' : 'Upload File'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <span className="text-gray-400 font-medium">OR</span>
                                <input
                                    type="text"
                                    placeholder="Paste Image/Video URL"
                                    className="border border-gray-200 focus:border-[#a0522d] focus:ring-1 focus:ring-[#a0522d] outline-none p-3 rounded-lg flex-1 transition-all"
                                    value={form.media_url}
                                    onChange={e => setForm({ ...form, media_url: e.target.value })}
                                />
                            </div>

                            {form.media_url && form.media_url.includes('drive.google.com') && (
                                <p className="text-sm text-red-500 font-medium mt-1">
                                    ⚠️ Google Drive preview links do not work directly. Please upload the file instead.
                                </p>
                            )}

                            {form.media_url && (
                                <div className="mt-4 h-[300px] w-full bg-gray-50 rounded-xl overflow-hidden relative border border-gray-200 flex items-center justify-center shadow-inner">
                                    {form.type === 'video' ? (
                                        <video src={form.media_url} autoPlay loop muted className="h-full w-auto max-w-full object-contain" controls />
                                    ) : (
                                        <img src={form.media_url} alt="Preview" className="h-full w-auto max-w-full object-contain" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || uploading || !form.media_url}
                            className="bg-[#a0522d] text-white py-3 px-8 font-bold rounded-lg hover:bg-[#804224] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave /> Save Hero Section
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
