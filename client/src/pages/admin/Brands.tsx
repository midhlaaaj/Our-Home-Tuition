import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaEdit, FaUpload, FaPlus, FaTimes } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Brand {
    id: string; // Supabase uses string UUIDs usually, or numbers
    name: string;
    logo_url: string;
    is_active: boolean;
    row_category: 'upper' | 'lower'; // Specifically for the two rows
}

const Brands: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
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
    const [showAddForm, setShowAddForm] = useState(false);

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
            const publicUrl = await uploadFile(file, 'uploads', 'brands', supabase);
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
            setShowAddForm(false);
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
        setShowAddForm(false); // Close add form if editing
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setForm({ is_active: true, name: '', logo_url: '', row_category: 'upper' });
    };


    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 font-['Urbanist']">
            <Link 
                to="/admin/homepage" 
                className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-[#1B2A5A] transition-colors uppercase tracking-widest mb-2 group w-fit"
            >
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                Back to Homepage Management
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Affiliated Brands</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage partner logos and carousel placement.</p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        if (isEditing) cancelEdit();
                    }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${showAddForm ? 'bg-orange-50 text-[#a0522d] border-2 border-[#a0522d]/20' : 'bg-[#1B2A5A] text-white hover:bg-[#142044] shadow-[#1B2A5A]/20'}`}
                    title={showAddForm ? "Close Form" : "Add New Brand"}
                >
                    {showAddForm ? <FaTimes size={18} /> : <FaPlus size={18} />}
                </button>
            </div>

            {/* Collapsible Add Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-[24px] shadow-xl border border-gray-50 mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#a0522d] flex items-center justify-center">
                            <FaPlus size={16} />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Register New Brand</h2>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo Preview</label>
                                <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border-2 border-dashed border-gray-100 group hover:border-[#a0522d]/30 transition-all">
                                    <div className="w-32 h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0">
                                        {form.logo_url ? (
                                            <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                                        ) : (
                                            <div className="text-gray-300 flex flex-col items-center gap-1">
                                                <FaUpload size={16} />
                                                <span className="text-[8px] font-bold uppercase tracking-tighter">No Logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-gray-800 mb-0.5">Brand Logo Asset</p>
                                        <p className="text-[10px] text-gray-400 font-medium">PNG or SVG recommended.</p>
                                    </div>
                                    <label className="px-5 py-2.5 bg-white border-2 border-gray-100 rounded-xl cursor-pointer hover:border-[#a0522d] hover:text-[#a0522d] transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <FaUpload size={12} />
                                        <span>{uploading ? 'Uploading...' : 'Click to Upload'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
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
                                <button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="px-8 py-3.5 bg-[#1B2A5A] text-white rounded-xl font-black hover:bg-[#142044] disabled:opacity-50 transition-all shadow-xl shadow-[#1B2A5A]/10 text-sm flex items-center justify-center gap-2 min-w-[140px]"
                                >
                                    {loading ? 'Saving...' : 'Add Brand Asset'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

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
                                <React.Fragment key={brand.id}>
                                    <tr className={`group hover:bg-gray-50/50 transition-all duration-300 ${editId === brand.id ? 'bg-orange-50/30' : ''}`}>
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
                                                {editId !== brand.id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(brand)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                            title="Edit Brand"
                                                        >
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(brand.id)} 
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" 
                                                            title="Delete Brand"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Inline Edit Form */}
                                    {editId === brand.id && (
                                        <tr className="bg-orange-50/20 border-x-2 border-orange-100/50">
                                            <td colSpan={5} className="p-6">
                                                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                                                    <form onSubmit={handleSubmit} className="space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand Name</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full bg-white border-2 border-gray-100 focus:border-[#a0522d] outline-none p-3 rounded-xl transition-all font-medium text-sm shadow-sm"
                                                                    value={form.name || ''}
                                                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                                                    required
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Carousel Row</label>
                                                                <select
                                                                    className="w-full bg-white border-2 border-gray-100 focus:border-[#a0522d] outline-none p-3 rounded-xl transition-all font-medium text-sm cursor-pointer shadow-sm appearance-none"
                                                                    value={form.row_category || 'upper'}
                                                                    onChange={e => setForm({ ...form, row_category: e.target.value as 'upper' | 'lower' })}
                                                                >
                                                                    <option value="upper">Upper Row</option>
                                                                    <option value="lower">Bottom Row</option>
                                                                </select>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                                                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm ${form.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                    {form.is_active ? 'Visible' : 'Hidden'}
                                                                </button>
                                                            </div>

                                                            <div className="md:col-span-2 space-y-1.5">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo Preview</label>
                                                                <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border-2 border-dashed border-orange-100/50 group hover:border-[#a0522d]/30 transition-all">
                                                                    <div className="w-32 h-16 bg-white rounded-xl border border-orange-100/20 flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0">
                                                                        {form.logo_url ? (
                                                                            <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                                                                        ) : (
                                                                            <div className="text-gray-300 flex flex-col items-center gap-1">
                                                                                <FaUpload size={16} />
                                                                                <span className="text-[8px] font-bold uppercase tracking-tighter">No Image</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-xs font-black text-gray-800 mb-0.5">Updated Asset</p>
                                                                        <p className="text-[10px] text-gray-400 font-medium">Logo will be updated upon saving.</p>
                                                                    </div>
                                                                    <label className="px-5 py-2.5 bg-white border-2 border-orange-100 rounded-xl cursor-pointer hover:border-[#a0522d] hover:text-[#a0522d] transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                                        <FaUpload size={12} />
                                                                        <span>{uploading ? '...' : 'Replace'}</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-end justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEdit}
                                                                    className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition-all text-[10px] uppercase tracking-widest"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    disabled={loading || uploading}
                                                                    className="px-8 py-3 bg-[#a0522d] text-white rounded-xl font-black hover:bg-[#8b4513] disabled:opacity-50 transition-all shadow-md text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                                                >
                                                                    {loading ? 'Saving...' : 'Update Asset'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
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
