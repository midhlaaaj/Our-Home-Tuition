import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaUpload, FaGripVertical } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Achievement {
    id: string;
    icon: string; // Used for the image URL
    display_order: number;
    is_active: boolean;
}

const AdminAchievements: React.FC = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragItemId, setDragItemId] = useState<string | null>(null);

    const fetchAchievements = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .order('display_order', { ascending: true });
            if (error) throw error;
            setAchievements(data || []);
        } catch (err) {
            console.error('Error fetching achievements:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const files = Array.from(e.target.files);

        try {
            const maxOrder = achievements.length > 0
                ? Math.max(...achievements.map(a => a.display_order || 0))
                : -1;

            const uploads = await Promise.all(
                files.map(async (file, idx) => {
                    const publicUrl = await uploadFile(file, 'achievements', 'achievements');
                    return {
                        icon: publicUrl,
                        display_order: maxOrder + 1 + idx,
                        is_active: true,
                        // Dummy data for constraints in case users have NOT NULL on text columns
                        title: 'Achievement Image',
                        description: 'Uploaded via drag and drop admin',
                        number: '1',
                    };
                })
            );

            const { error } = await supabase.from('achievements').insert(uploads);
            if (error) throw error;
            fetchAchievements();
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Failed to upload. Make sure the "achievements" bucket is configured correctly.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this achievement image?')) return;
        try {
            const { error } = await supabase.from('achievements').delete().eq('id', id);
            if (error) throw error;
            setAchievements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete.');
        }
    };

    const handleToggleActive = async (achievement: Achievement) => {
        try {
            const { error } = await supabase
                .from('achievements')
                .update({ is_active: !achievement.is_active })
                .eq('id', achievement.id);
            if (error) throw error;
            setAchievements(prev => prev.map(a => a.id === achievement.id ? { ...a, is_active: !a.is_active } : a));
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

        const oldIndex = achievements.findIndex(a => a.id === dragItemId);
        const newIndex = achievements.findIndex(a => a.id === targetId);
        const reordered = [...achievements];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        const updated = reordered.map((a, i) => ({ ...a, display_order: i }));
        setAchievements(updated);

        try {
            await Promise.all(
                updated.map(a =>
                    supabase.from('achievements').update({ display_order: a.display_order }).eq('id', a.id)
                )
            );
        } catch (err) {
            console.error('Reorder save failed:', err);
            fetchAchievements();
        }

        setDragItemId(null);
        setDragOverId(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gallery of Success</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Manage certification and achievement slides</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Status: Visual Layer</span>
                </div>
            </div>

            {/* Upload zone */}
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-50 flex flex-col gap-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-100 rounded-[20px] cursor-pointer hover:border-[#1B2A5A]/30 hover:bg-slate-50 transition-all group bg-gray-50/20">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                        <FaUpload className="text-2xl text-gray-300 group-hover:text-[#1B2A5A] mb-2 transition-colors" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#1B2A5A]">
                            {uploading ? 'Processing Signal...' : 'Transmit New Achievement Assets'}
                        </p>
                        <p className="text-[8px] text-gray-300 font-bold mt-1">PNG, JPG, WEBP • Multiple Allowed</p>
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

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-video bg-white rounded-2xl border border-gray-50 animate-pulse shadow-sm"></div>
                    ))}
                </div>
            ) : achievements.length === 0 ? (
                <div className="bg-white rounded-[32px] p-16 text-center border border-gray-50 shadow-2xl">
                    <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUpload size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">Visual Empty</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Awaiting new success modules.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {achievements.map(achievement => (
                        <div
                            key={achievement.id}
                            draggable
                            onDragStart={() => handleDragStart(achievement.id)}
                            onDragOver={e => handleDragOver(e, achievement.id)}
                            onDrop={e => handleDrop(e, achievement.id)}
                            onDragLeave={() => setDragOverId(null)}
                            className={`bg-white rounded-[20px] shadow-xl border overflow-hidden transition-all cursor-grab active:cursor-grabbing group relative ${dragOverId === achievement.id ? 'border-[#1B2A5A] scale-[1.05] shadow-2xl z-20' : 'border-gray-50'
                                } ${!achievement.is_active ? 'opacity-40 grayscale' : ''}`}
                        >
                            <div className="relative aspect-video overflow-hidden bg-gray-900">
                                <img
                                    src={achievement.icon}
                                    alt="Achievement"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md p-1 rounded-md text-white/50 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                    <FaGripVertical size={10} />
                                </div>
                            </div>
                            <div className="p-2.5 flex items-center justify-between gap-1.5 bg-white border-t border-gray-50">
                                <button
                                    onClick={() => handleToggleActive(achievement)}
                                    className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all ${achievement.is_active
                                        ? 'bg-[#1B2A5A] text-white shadow-lg shadow-blue-900/10'
                                        : 'bg-gray-50 text-gray-300'
                                        }`}
                                >
                                    {achievement.is_active ? 'Online' : 'Offline'}
                                </button>
                                <button
                                    onClick={() => handleDelete(achievement.id)}
                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    title="Purge"
                                >
                                    <FaTrash size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAchievements;
