import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaUpload, FaGripVertical } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Partner {
    id: string;
    media_url: string;
    display_order: number;
    is_active: boolean;
}

const AdminPartners: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragItemId, setDragItemId] = useState<string | null>(null);

    const fetchPartners = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .order('display_order', { ascending: true });
            if (error) throw error;
            setPartners(data || []);
        } catch (err) {
            console.error('Error fetching partners:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const files = Array.from(e.target.files);

        try {
            const maxOrder = partners.length > 0
                ? Math.max(...partners.map(p => p.display_order))
                : -1;

            const uploads = await Promise.all(
                files.map(async (file, idx) => {
                    const publicUrl = await uploadFile(file, 'uploads', 'partners');
                    return {
                        media_url: publicUrl,
                        display_order: maxOrder + 1 + idx,
                        is_active: true,
                    };
                })
            );

            const { error } = await supabase.from('partners').insert(uploads);
            if (error) throw error;
            fetchPartners();
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload. Make sure the "uploads" bucket exists and is public.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this partner image?')) return;
        try {
            const { error } = await supabase.from('partners').delete().eq('id', id);
            if (error) throw error;
            setPartners(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete.');
        }
    };

    const handleToggleActive = async (partner: Partner) => {
        try {
            const { error } = await supabase
                .from('partners')
                .update({ is_active: !partner.is_active })
                .eq('id', partner.id);
            if (error) throw error;
            setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, is_active: !p.is_active } : p));
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    // Drag-and-drop reorder
    const handleDragStart = (id: string) => setDragItemId(id);
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        setDragOverId(id);
    };
    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!dragItemId || dragItemId === targetId) {
            setDragItemId(null);
            setDragOverId(null);
            return;
        }

        const oldIndex = partners.findIndex(p => p.id === dragItemId);
        const newIndex = partners.findIndex(p => p.id === targetId);
        const reordered = [...partners];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        const updated = reordered.map((p, i) => ({ ...p, display_order: i }));
        setPartners(updated);

        try {
            await Promise.all(
                updated.map(p =>
                    supabase.from('partners').update({ display_order: p.display_order }).eq('id', p.id)
                )
            );
        } catch (err) {
            console.error('Reorder save failed:', err);
            fetchPartners();
        }

        setDragItemId(null);
        setDragOverId(null);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Partner Slides</h1>
                <p className="text-gray-500 mt-2">
                    Manage images shown in the partner slider on the homepage. Drag to reorder.
                </p>
            </div>

            {/* Upload zone */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#ffb76c] hover:bg-orange-50 transition-all group">
                    <FaUpload className="text-3xl text-gray-300 group-hover:text-[#ffb76c] mb-3 transition-colors" />
                    <span className="text-gray-500 font-medium group-hover:text-[#a0522d] transition-colors">
                        {uploading ? 'Uploading...' : 'Click to upload images (multiple allowed)'}
                    </span>
                    <span className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP</span>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {/* Partners Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-[#ffb76c] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : partners.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-lg font-medium">No partner images yet.</p>
                    <p className="text-sm mt-1">Upload some images above to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {partners.map(partner => (
                        <div
                            key={partner.id}
                            draggable
                            onDragStart={() => handleDragStart(partner.id)}
                            onDragOver={e => handleDragOver(e, partner.id)}
                            onDrop={e => handleDrop(e, partner.id)}
                            onDragLeave={() => setDragOverId(null)}
                            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all cursor-grab active:cursor-grabbing ${dragOverId === partner.id ? 'border-[#ffb76c] scale-[1.02] shadow-md' : 'border-gray-100'
                                } ${!partner.is_active ? 'opacity-50' : ''}`}
                        >
                            <div className="relative aspect-video overflow-hidden bg-gray-50">
                                <img
                                    src={partner.media_url}
                                    alt="Partner"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-lg text-gray-400">
                                    <FaGripVertical />
                                </div>
                            </div>
                            <div className="p-3 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => handleToggleActive(partner)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${partner.is_active
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {partner.is_active ? 'Active' : 'Hidden'}
                                </button>
                                <button
                                    onClick={() => handleDelete(partner.id)}
                                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete"
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPartners;
