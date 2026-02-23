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
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Stats Counters</h1>

            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    {isEditing ? <FaEdit className="mr-2" /> : <FaPlus className="mr-2" />}
                    {isEditing ? 'Edit Counter' : 'Add New Counter'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Label (e.g. Students)"
                        className="border p-2 rounded"
                        value={form.label || ''}
                        onChange={e => setForm({ ...form, label: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Value (e.g. 1000)"
                        className="border p-2 rounded"
                        value={form.value || ''}
                        onChange={e => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Suffix (e.g. + or K+)"
                        className="border p-2 rounded"
                        value={form.suffix || ''}
                        onChange={e => setForm({ ...form, suffix: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Display Order"
                        className="border p-2 rounded"
                        value={form.display_order || 0}
                        onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            className="mr-2 h-4 w-4"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-gray-700">Active</label>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex space-x-2">
                        <button type="submit" className="bg-[#ffb76c] text-white px-4 py-2 rounded hover:bg-orange-400 font-bold flex-1">
                            {isEditing ? 'Update Counter' : 'Add Counter'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setForm({ label: '', value: 0, suffix: '', is_active: true, display_order: 0 }); }}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 font-bold"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-3 font-semibold text-gray-600">Order</th>
                            <th className="p-3 font-semibold text-gray-600">Label</th>
                            <th className="p-3 font-semibold text-gray-600">Value</th>
                            <th className="p-3 font-semibold text-gray-600">Suffix</th>
                            <th className="p-3 font-semibold text-gray-600">Status</th>
                            <th className="p-3 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : counters.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No counters found. Add one above.</td></tr>
                        ) : (
                            counters.map(counter => (
                                <tr key={counter.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-3">{counter.display_order}</td>
                                    <td className="p-3 font-medium">{counter.label}</td>
                                    <td className="p-3">{counter.value}</td>
                                    <td className="p-3 text-gray-500">{counter.suffix}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleToggleActive(counter)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors ${counter.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                                        >
                                            {counter.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="p-3 flex space-x-3">
                                        <button
                                            onClick={() => handleEdit(counter)}
                                            className="text-blue-500 hover:text-blue-700 transition-colors"
                                            title="Edit"
                                        >
                                            <FaEdit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(counter.id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Delete"
                                        >
                                            <FaTrash size={18} />
                                        </button>
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

export default AdminCounters;
