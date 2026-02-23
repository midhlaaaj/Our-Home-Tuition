import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaMagic, FaUpload } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Brand {
    id: string; // Supabase uses string UUIDs usually, or numbers
    name: string;
    logo_url: string;
    is_active: boolean;
    row_category: 'upper' | 'lower'; // Specifically for the two rows
}

const Brands: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<Partial<Brand>>({
        is_active: true,
        row_category: 'upper',
        name: '',
        logo_url: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBrands(data || []);
        } catch (err) {
            console.error('Error fetching brands:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const publicUrl = await uploadFile(file, 'uploads', 'brands');
            setForm(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload logo. Make sure the "uploads" bucket exists and is public.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const brandData = {
                name: form.name,
                logo_url: form.logo_url,
                is_active: form.is_active,
                row_category: form.row_category // Saving the row preference
            };

            if (isEditing && editId) {
                const { error } = await supabase
                    .from('brands')
                    .update(brandData)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('brands')
                    .insert([brandData]);
                if (error) throw error;
            }

            setForm({ is_active: true, name: '', logo_url: '', row_category: 'upper' }); // Reset form
            setIsEditing(false);
            setEditId(null);
            fetchBrands();
        } catch (err) {
            console.error('Error saving brand:', err);
            alert('Failed to save brand');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this brand?')) return;

        try {
            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchBrands();
        } catch (err) {
            console.error('Error deleting brand:', err);
        }
    };

    const handleEdit = (brand: Brand) => {
        setForm(brand);
        setIsEditing(true);
        setEditId(brand.id);
    };

    const handleSeed = async () => {
        if (!window.confirm('This will Wipe existing data and seed the EXACT requests?')) return;
        setLoading(true);

        const upperLogos = [
            { name: "Google", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png", row_category: 'upper', is_active: true },
            { name: "Microsoft", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/2560px-Microsoft_logo_%282012%29.svg.png", row_category: 'upper', is_active: true },
            { name: "Amazon", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png", row_category: 'upper', is_active: true },
            { name: "Meta", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/2560px-Meta_Platforms_Inc._logo.svg.png", row_category: 'upper', is_active: true },
            { name: "Apple", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png", row_category: 'upper', is_active: true },
            { name: "Netflix", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png", row_category: 'upper', is_active: true },
            { name: "Adobe", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Adobe_Systems_logo_and_wordmark.svg/2560px-Adobe_Systems_logo_and_wordmark.svg.png", row_category: 'upper', is_active: true },
            { name: "Tesla", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/2560px-Tesla_Motors.svg.png", row_category: 'upper', is_active: true },
            { name: "Intel", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Intel-logo.svg/2560px-Intel-logo.svg.png", row_category: 'upper', is_active: true },
            { name: "IBM", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/2560px-IBM_logo.svg.png", row_category: 'upper', is_active: true }
        ];

        const lowerLogos = [
            { name: "Oracle", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/2560px-Oracle_logo.svg.png", row_category: 'lower', is_active: true },
            { name: "NVIDIA", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/2560px-Nvidia_logo.svg.png", row_category: 'lower', is_active: true },
            { name: "Cisco", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/2560px-Cisco_logo_blue_2016.svg.png", row_category: 'lower', is_active: true },
            { name: "Samsung", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png", row_category: 'lower', is_active: true },
            { name: "Spotify", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png", row_category: 'lower', is_active: true },
            { name: "LinkedIn", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/800px-LinkedIn_logo_initials.png", row_category: 'lower', is_active: true },
            { name: "Uber", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/2560px-Uber_logo_2018.svg.png", row_category: 'lower', is_active: true },
            { name: "Airbnb", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/2560px-Airbnb_Logo_B%C3%A9lo.svg.png", row_category: 'lower', is_active: true },
            { name: "PayPal", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png", row_category: 'lower', is_active: true },
            { name: "Twitter", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/512px-Logo_of_Twitter.svg.png", row_category: 'lower', is_active: true }
        ];

        try {
            // Optional: clear table first to avoid duplicates if desired, or just append
            // await supabase.from('brands').delete().neq('id', 0); // Risky without policies

            const { error } = await supabase.from('brands').insert([...upperLogos, ...lowerLogos]);
            if (error) throw error;
            fetchBrands();
            alert('Brands seeded successfully!');
        } catch (err) {
            console.error('Error seeding brands:', err);
            alert('Failed to seed brands. Table might be missing or RLS issue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Affiliated Logos</h1>
                <button
                    onClick={handleSeed}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    disabled={loading}
                >
                    <FaMagic /> Seed Default Logos
                </button>
            </div>

            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Brand' : 'Add New Brand'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Brand Name"
                        className="border p-2 rounded"
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />

                    <div>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <label className="flex-1 cursor-pointer bg-[#ffb76c] hover:bg-orange-500 text-white py-2 px-4 rounded text-center transition flex items-center justify-center gap-2">
                                    <FaUpload /> {uploading ? 'Uploading...' : 'Upload Logo'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <span className="text-gray-400 text-sm">OR</span>
                                <input
                                    type="text"
                                    placeholder="Logo URL"
                                    className="border p-2 rounded flex-1"
                                    value={form.logo_url || ''}
                                    onChange={e => setForm({ ...form, logo_url: e.target.value })}
                                />
                            </div>

                            {form.logo_url && (
                                <div className="mt-2 h-16 w-full bg-gray-100 rounded overflow-hidden relative border flex items-center justify-center">
                                    <img src={form.logo_url} alt="Preview" className="h-full w-auto max-w-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row Selector */}
                    <div>
                        <select
                            className="border p-2 rounded w-full"
                            value={form.row_category || 'upper'}
                            onChange={e => setForm({ ...form, row_category: e.target.value as 'upper' | 'lower' })}
                        >
                            <option value="upper">Upper Row (Scrolls Left)</option>
                            <option value="lower">Bottom Row (Scrolls Right)</option>
                        </select>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <label>Active</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="bg-[#ffb76c] text-white p-2 rounded col-span-2 hover:bg-orange-400 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Brand' : 'Add Brand')}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => { setIsEditing(false); setForm({ is_active: true, name: '', logo_url: '', row_category: 'upper' }); }}
                            className="bg-gray-500 text-white p-2 rounded col-span-2"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            {/* List */}
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Name</th>
                            <th className="p-2">Logo</th>
                            <th className="p-2">Row</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">No brands found. Click "Seed Default Logos" to get started.</td>
                            </tr>
                        ) : (
                            brands.map((brand) => (
                                <tr key={brand.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{brand.name}</td>
                                    <td className="p-2">
                                        <img src={brand.logo_url} alt={brand.name} className="h-8 object-contain max-w-[100px]" />
                                    </td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs text-white ${brand.row_category === 'upper' ? 'bg-blue-500' : 'bg-indigo-500'}`}>
                                            {brand.row_category === 'upper' ? 'Upper' : 'Lower'}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs text-white ${brand.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {brand.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-2 flex space-x-2">
                                        <button onClick={() => handleEdit(brand)} className="text-blue-500 hover:text-blue-700"><FaEdit /></button>
                                        <button onClick={() => handleDelete(brand.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Brands;
