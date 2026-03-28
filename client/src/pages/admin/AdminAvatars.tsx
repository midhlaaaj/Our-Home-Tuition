import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaUpload } from 'react-icons/fa';

const AdminAvatars: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [avatars, setAvatars] = useState<{ name: string, url: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchAvatars();
    }, []);

    const fetchAvatars = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .storage
                .from('prebuilt-avatars')
                .list();

            if (error) {
                console.error('Error fetching avatars:', error);
            } else {
                const avatarList = (data || [])
                    .filter((file: any) => file.name !== '.emptyFolderPlaceholder')
                    .map((file: any) => {
                        const { data: publicUrlData } = supabase
                            .storage
                            .from('prebuilt-avatars')
                            .getPublicUrl(file.name);
                        return { name: file.name, url: publicUrlData.publicUrl };
                    });
                setAvatars(avatarList);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const files = Array.from(event.target.files);
        setUploading(true);

        try {
            for (const file of files) {
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

                const { error } = await supabase.storage
                    .from('prebuilt-avatars')
                    .upload(fileName, file);

                if (error) {
                    console.error(`Error uploading ${file.name}:`, error);
                    alert(`Failed to upload ${file.name}: ${error.message}`);
                }
            }
            await fetchAvatars();
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!window.confirm('Are you sure you want to delete this avatar?')) return;

        try {
            const { error } = await supabase.storage
                .from('prebuilt-avatars')
                .remove([fileName]);

            if (error) {
                throw error;
            }

            await fetchAvatars();
        } catch (error: any) {
            console.error('Delete error:', error);
            alert('Failed to delete avatar: ' + error.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Identity Matrix</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Pre-built avatar asset distribution layer</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Bucket: Prebuilt-Avatars</span>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-50 flex flex-col gap-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-100 rounded-[20px] cursor-pointer hover:border-[#ffb76c]/30 hover:bg-orange-50 transition-all group bg-orange-50/5">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3 text-center">
                        <FaUpload className="text-2xl text-gray-300 group-hover:text-[#ffb76c] mb-2 transition-colors" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-[#a0522d]">
                            {uploading ? 'Synching Assets...' : 'Initialize Identity Upload'}
                        </p>
                        <p className="text-[8px] text-gray-300 font-bold mt-1 tracking-widest">MULTIPLE SELECTION SUPPORTED</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-square bg-white rounded-2xl border border-gray-50 animate-pulse shadow-sm"></div>
                    ))}
                </div>
            ) : avatars.length === 0 ? (
                <div className="bg-white rounded-[32px] p-16 text-center border border-gray-50 shadow-2xl">
                    <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUpload size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">Matrix Vacant</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">No pre-built identities registered.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {avatars.map((avatar) => (
                        <div key={avatar.name} className="group relative aspect-square bg-white rounded-2xl shadow-xl border border-gray-50 overflow-hidden transition-all hover:scale-105 hover:shadow-2xl">
                            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                                <button
                                    onClick={() => handleDelete(avatar.name)}
                                    className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-red-500 transition-all border border-white/20 hover:border-red-600 shadow-xl"
                                    title="Deactivate Unit"
                                >
                                    <FaTrash size={12} />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[7px] text-gray-400 font-black truncate px-1 text-center">{avatar.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAvatars;
