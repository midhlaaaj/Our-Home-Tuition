import React, { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaUpload, FaGripVertical } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';
import { useAuth } from '../../context/AuthContext';

interface Partner {
    id: string;
    media_url: string;
    display_order: number;
    is_active: boolean;
}

const AdminPartners: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
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
    }, [supabase]);

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
                    const publicUrl = await uploadFile(file, 'uploads', 'partners', supabase);
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
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Alliance Grid</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Manage institutional and corporate partner slides</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] animate-pulse">Live Link</span>
                </div>
            </div>

            {/* Upload zone */}
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-50 flex flex-col gap-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-100 rounded-[20px] cursor-pointer hover:border-[#ffb76c]/30 hover:bg-orange-50 transition-all group bg-orange-50/10">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <FaUpload className="text-2xl text-gray-300 group-hover:text-[#ffb76c] mb-2 transition-colors" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-[#a0522d]">
                            {uploading ? 'Interfacing...' : 'Ingest Partner Assets'}
                        </p>
                        <p className="text-[8px] text-gray-300 font-bold mt-1 tracking-widest leading-none">PNG, JPG, WEBP • CLOUD REPLICA</p>
                    </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-video bg-white rounded-2xl border border-gray-50 animate-pulse shadow-sm"></div>
                    ))}
                </div>
            ) : partners.length === 0 ? (
                <div className="bg-white rounded-[32px] p-16 text-center border border-gray-50 shadow-2xl">
                    <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUpload size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">Grid Offline</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Awaiting alliance authentication.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {partners.map(partner => (
                        <div
                            key={partner.id}
                            draggable
                            onDragStart={() => handleDragStart(partner.id)}
                            onDragOver={e => handleDragOver(e, partner.id)}
                            onDrop={e => handleDrop(e, partner.id)}
                            onDragLeave={() => setDragOverId(null)}
                            className={`bg-white rounded-[20px] shadow-xl border overflow-hidden transition-all cursor-grab active:cursor-grabbing group relative ${dragOverId === partner.id ? 'border-[#ffb76c] scale-[1.05] shadow-2xl z-20' : 'border-gray-50'
                                } ${!partner.is_active ? 'opacity-40 grayscale' : ''}`}
                        >
                            <div className="relative aspect-video overflow-hidden bg-white p-4">
                                <img
                                    src={partner.media_url}
                                    alt="Partner"
                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/5 transition-colors"></div>
                                <div className="absolute top-2 left-2 bg-white/60 backdrop-blur-md p-1.5 rounded-lg text-[#1B2A5A] shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-all translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 duration-300">
                                    <FaGripVertical size={12} />
                                </div>
                            </div>
                            <div className="p-2.5 flex items-center justify-between gap-1.5 bg-white border-t border-gray-50">
                                <button
                                    onClick={() => handleToggleActive(partner)}
                                    className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all ${partner.is_active
                                        ? 'bg-[#ffb76c] text-[#a0522d] shadow-lg shadow-orange-900/10'
                                        : 'bg-gray-50 text-gray-300'
                                        }`}
                                >
                                    {partner.is_active ? 'ENABLED' : 'STAGED'}
                                </button>
                                <button
                                    onClick={() => handleDelete(partner.id)}
                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-all md:opacity-0 md:group-hover:opacity-100"
                                    title="De-link"
                                >
                                    <FaTrash size={12} />
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
