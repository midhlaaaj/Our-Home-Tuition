import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

interface Counter {
    id: string;
    label: string;
    value: number;
    suffix: string;
    is_active: boolean;
    display_order: number;
}

const AdminCounters: React.FC = () => {
    const [counters, setCounters] = useState<Counter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Counter>>({
        label: '',
        value: 0,
        suffix: '',
        is_active: true,
        display_order: 0
    });

    const fetchCounters = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('counters')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            if (data) setCounters(data);
        } catch (error) {
            console.error('Error fetching counters:', error);
            alert('Failed to fetch counters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounters();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editId) {
                const { error } = await supabase
                    .from('counters')
                    .update(form)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('counters')
                    .insert([form]);
                if (error) throw error;
            }

            setForm({ label: '', value: 0, suffix: '', is_active: true, display_order: 0 });
            setIsEditing(false);
            setEditId(null);
            fetchCounters();
        } catch (error) {
            console.error('Error saving counter:', error);
            alert('Failed to save counter');
        }
    };

    const handleEdit = (counter: Counter) => {
        setForm(counter);
        setIsEditing(true);
        setEditId(counter.id);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this counter?')) return;

        try {
            const { error } = await supabase
                .from('counters')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCounters();
        } catch (error) {
            console.error('Error deleting counter:', error);
            alert('Failed to delete counter');
        }
    };

    const handleToggleActive = async (counter: Counter) => {
        try {
            const { error } = await supabase
                .from('counters')
                .update({ is_active: !counter.is_active })
                .eq('id', counter.id);

            if (error) throw error;
            fetchCounters();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vitals & Metrics</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Configure global statistical impact counters</p>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Domain: Analytic-Layer</span>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white p-5 rounded-[28px] shadow-2xl border border-gray-50 mb-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ffb76c] flex items-center justify-center">
                        {isEditing ? <FaEdit size={14} /> : <FaPlus size={14} />}
                    </div>
                    <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase">
                        {isEditing ? 'Re-calibrate Metric' : 'Initialize New Metric'}
                    </h2>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Label</label>
                        <input
                            type="text"
                            placeholder="e.g. Active Students"
                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#ffb76c] focus:bg-white outline-none px-4 py-2 rounded-xl transition-all font-bold text-xs"
                            value={form.label || ''}
                            onChange={e => setForm({ ...form, label: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Value</label>
                        <input
                            type="number"
                            placeholder="e.g. 5000"
                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#ffb76c] focus:bg-white outline-none px-4 py-2 rounded-xl transition-all font-bold text-xs"
                            value={form.value || ''}
                            onChange={e => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Suffix</label>
                        <input
                            type="text"
                            placeholder="e.g. +"
                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#ffb76c] focus:bg-white outline-none px-4 py-2 rounded-xl transition-all font-bold text-xs"
                            value={form.suffix || ''}
                            onChange={e => setForm({ ...form, suffix: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Sequence</label>
                        <input
                            type="number"
                            placeholder="Order"
                            className="w-full bg-gray-50 border border-gray-100 focus:border-[#ffb76c] focus:bg-white outline-none px-4 py-2 rounded-xl transition-all font-bold text-xs"
                            value={form.display_order || 0}
                            onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="flex items-center gap-2 px-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="h-3.5 w-3.5 rounded-md border-gray-200 text-[#ffb76c] focus:ring-[#ffb76c]"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transmit Live</label>
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                        <button type="submit" className="flex-1 bg-[#1B2A5A] text-white px-4 py-2 rounded-xl hover:bg-[#142044] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-900/10">
                            {isEditing ? 'Confirm Delta' : 'Deploy To Production'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setForm({ label: '', value: 0, suffix: '', is_active: true, display_order: 0 }); }}
                                className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-200 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Abort
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List - Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white h-24 rounded-2xl border border-gray-50 animate-pulse shadow-sm"></div>
                    ))
                ) : counters.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[32px] p-12 text-center border border-gray-50 shadow-2xl">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No spectral metrics recorded yet.</p>
                    </div>
                ) : (
                    counters.map(counter => (
                        <div key={counter.id} className={`bg-white p-4 rounded-2xl shadow-xl border transition-all duration-300 group hover:scale-[1.02] ${counter.is_active ? 'border-gray-50' : 'border-gray-100 opacity-60 grayscale'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[8px] font-black text-gray-300 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                    SEQ: {counter.display_order}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(counter)}
                                        className="p-1.5 text-gray-400 hover:text-[#1B2A5A] hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <FaEdit size={10} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(counter.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FaTrash size={10} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-center pb-2">
                                <div className="text-2xl font-black text-gray-900 mb-0.5">
                                    {counter.value}{counter.suffix}
                                </div>
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    {counter.label}
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-center">
                                <button
                                    onClick={() => handleToggleActive(counter)}
                                    className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${counter.is_active ? 'bg-green-100 text-green-600 border border-green-200/50' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    {counter.is_active ? 'Streaming' : 'Offline'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminCounters;
