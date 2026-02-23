import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaUpload } from 'react-icons/fa';

const AdminAvatars: React.FC = () => {
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
                const avatarList = data
                    .filter(file => file.name !== '.emptyFolderPlaceholder')
                    .map(file => {
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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Avatars</h1>

            {/* Upload Section */}
            <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center">
                <FaUpload className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">Upload new avatars using drag and drop or click to select</p>
                <label className="cursor-pointer bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50">
                    {uploading ? 'Uploading...' : 'Select Images'}
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
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
            ) : avatars.length === 0 ? (
                <p className="text-center text-gray-500">No avatars found.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {avatars.map((avatar) => (
                        <div key={avatar.name} className="group relative aspect-square bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={() => handleDelete(avatar.name)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform scale-75 group-hover:scale-100 duration-200"
                                    title="Delete Avatar"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAvatars;
