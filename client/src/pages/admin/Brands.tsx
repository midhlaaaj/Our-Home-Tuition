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


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Affiliated Brands</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage partner logos and carousel placement.</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-50 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                        <FaEdit size={16} />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                        {isEditing ? 'Edit Brand Asset' : 'Register New Brand'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Google, Microsoft"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                value={form.name || ''}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Carousel Row</label>
                            <select
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm appearance-none cursor-pointer"
                                value={form.row_category || 'upper'}
                                onChange={e => setForm({ ...form, row_category: e.target.value as 'upper' | 'lower' })}
                            >
                                <option value="upper">Upper Row (Scrolls Left)</option>
                                <option value="lower">Bottom Row (Scrolls Right)</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo Asset</label>
                            <div className="flex gap-3">
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Logo URL"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3.5 rounded-xl transition-all font-medium text-sm"
                                        value={form.logo_url || ''}
                                        onChange={e => setForm({ ...form, logo_url: e.target.value })}
                                    />
                                    <label className="flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm shrink-0">
                                        <FaUpload size={14} className="text-gray-400" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                {form.logo_url && (
                                    <div className="relative shrink-0 flex items-center justify-center bg-gray-50 p-2 rounded-xl border border-gray-100 w-24">
                                        <img src={form.logo_url} alt="Preview" className="max-h-8 max-w-full object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border-2 border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.is_active ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                                    {form.is_active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                />
                                <span className="text-xs font-black text-gray-800">Active in Carousel</span>
                            </label>
                        </div>

                        <div className="flex gap-2 justify-end col-span-2 md:col-span-1 ml-auto">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setForm({ is_active: true, name: '', logo_url: '', row_category: 'upper' }); }}
                                    className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="px-8 py-3.5 bg-[#1B2A5A] text-white rounded-xl font-black hover:bg-[#142044] disabled:opacity-50 transition-all shadow-xl shadow-[#1B2A5A]/10 text-sm flex items-center justify-center gap-2 min-w-[140px]"
                            >
                                {loading ? 'Saving...' : (isEditing ? 'Update Brand' : 'Add Brand')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Partner Ecosystem</h2>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-gray-200/50">
                        {brands.length} Assets
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Brand</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Logo Asset</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Placement</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {brands.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 text-sm font-medium italic">No brands registered.</td>
                                </tr>
                            ) : (
                                brands.map((brand) => (
                                    <tr key={brand.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                                        <td className="p-4 font-black text-gray-900 text-sm">{brand.name}</td>
                                        <td className="p-4">
                                            <div className="bg-white p-2 rounded-lg border border-gray-50 inline-block shadow-sm">
                                                <img src={brand.logo_url} alt={brand.name} className="h-6 object-contain max-w-[80px]" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tight border ${brand.row_category === 'upper'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                {brand.row_category === 'upper' ? 'UPPER ROW' : 'LOWER ROW'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-[0.1em] uppercase border shadow-sm ${brand.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                                {brand.is_active ? 'Live' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => handleEdit(brand)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all" title="Edit Brand"><FaEdit size={14} /></button>
                                                <button onClick={() => handleDelete(brand.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete Brand"><FaTrash size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Brands;
