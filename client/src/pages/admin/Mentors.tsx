import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaUpload, FaMagic } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Mentor {
    id: string; // Supabase uses id (uuid)
    name: string;
    subject: string;
    description: string;
    image_url: string; // specific naming convention for supabase
    is_active: boolean;
}

const Mentors: React.FC = () => {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<Partial<Mentor>>({
        is_active: true,
        name: '',
        subject: '',
        description: '',
        image_url: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mentors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMentors(data || []);
        } catch (err) {
            console.error('Error fetching mentors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            // Upload to 'mentors' bucket
            const publicUrl = await uploadFile(file, 'mentors', 'mentors');
            setForm(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Make sure the "mentors" bucket exists and is public.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const mentorData = {
                name: form.name,
                subject: form.subject,
                description: form.description,
                image_url: form.image_url,
                is_active: form.is_active
            };

            if (isEditing && editId) {
                const { error } = await supabase
                    .from('mentors')
                    .update(mentorData)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('mentors')
                    .insert([mentorData]);
                if (error) throw error;
            }

            setForm({ is_active: true, name: '', subject: '', description: '', image_url: '' });
            setIsEditing(false);
            setEditId(null);
            fetchMentors();
        } catch (err) {
            console.error('Error saving mentor:', err);
            alert('Failed to save mentor. Ensure "mentors" table exists in Supabase.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;

        try {
            const { error } = await supabase
                .from('mentors')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchMentors();
        } catch (err) {
            console.error('Error deleting mentor:', err);
        }
    };

    const handleEdit = (mentor: Mentor) => {
        setForm(mentor);
        setIsEditing(true);
        setEditId(mentor.id);
    };

    const handleSeed = async () => {
        if (!window.confirm('This will add 6 default mentors. Continue?')) return;
        setLoading(true);

        const sampleMentors = [
            {
                name: "Dr. Sarah Johnson",
                subject: "Mathematics",
                description: "Ph.D. in Mathematics with 10+ years of teaching experience. Specializes in Calculus and Algebra.",
                image_url: "https://randomuser.me/api/portraits/women/44.jpg",
                is_active: true
            },
            {
                name: "Prof. Michael Chen",
                subject: "Physics",
                description: "Former research scientist at CERN. Passionate about making complex physics concepts accessible to students.",
                image_url: "https://randomuser.me/api/portraits/men/32.jpg",
                is_active: true
            },
            {
                name: "Emily Davis",
                subject: "English Literature",
                description: "Published author and literature enthusiast. Helps students develop critical thinking and writing skills.",
                image_url: "https://randomuser.me/api/portraits/women/68.jpg",
                is_active: true
            },
            {
                name: "Robert Wilson",
                subject: "Computer Science",
                description: "Software Engineer with industry experience. Teaches coding fundamentals, algorithms, and web development.",
                image_url: "https://randomuser.me/api/portraits/men/86.jpg",
                is_active: true
            },
            {
                name: "Dr. Anita Patel",
                subject: "Biology",
                description: "Expert in Molecular Biology. Inspires curiosity about the living world through interactive lessons.",
                image_url: "https://randomuser.me/api/portraits/women/63.jpg",
                is_active: true
            },
            {
                name: "James Thompson",
                subject: "Chemistry",
                description: "Experienced Chemistry tutor. Focuses on practical applications and clear understanding of chemical reactions.",
                image_url: "https://randomuser.me/api/portraits/men/46.jpg",
                is_active: true
            }
        ];

        try {
            const { error } = await supabase.from('mentors').insert(sampleMentors);
            if (error) throw error;
            fetchMentors();
            alert('Default mentors added successfully!');
        } catch (err) {
            console.error('Error seeding mentors:', err);
            alert('Failed to seed mentors. Is the "mentors" table created in Supabase?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Mentors</h1>
                <button
                    onClick={handleSeed}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    disabled={loading}
                >
                    <FaMagic /> Seed Default Mentors
                </button>
            </div>

            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Mentor' : 'Add New Mentor'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Mentor Name"
                        className="border p-2 rounded"
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />

                    <input
                        type="text"
                        placeholder="Subject (e.g. Mathematics)"
                        className="border p-2 rounded"
                        value={form.subject || ''}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        required
                    />

                    <div className="md:col-span-2">
                        <textarea
                            placeholder="Short Description"
                            className="border p-2 rounded w-full h-24"
                            value={form.description || ''}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-gray-700">Mentor Photo</label>
                            <div className="flex gap-2 items-center">
                                <label className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center transition flex items-center justify-center gap-2">
                                    <FaUpload /> {uploading ? 'Uploading...' : 'Upload Photo'}
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
                                    placeholder="Image URL"
                                    className="border p-2 rounded flex-1"
                                    value={form.image_url || ''}
                                    onChange={e => setForm({ ...form, image_url: e.target.value })}
                                />
                            </div>

                            {form.image_url && (
                                <div className="mt-2 h-32 w-32 bg-gray-100 rounded overflow-hidden relative border flex items-center justify-center mx-auto md:mx-0">
                                    <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center md:col-span-2">
                        <input
                            type="checkbox"
                            className="mr-2 h-5 w-5"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <label>Active (Visible on website)</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="bg-green-600 text-white p-2 rounded col-span-2 hover:bg-green-700 disabled:opacity-50 font-bold"
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Mentor' : 'Add Mentor')}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => { setIsEditing(false); setForm({ is_active: true, name: '', subject: '', description: '', image_url: '' }); }}
                            className="bg-gray-500 text-white p-2 rounded col-span-2"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            {/* List */}
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="p-3">Photo</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Subject</th>
                            <th className="p-3 w-1/3">Description</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mentors.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">No mentors found. Add one above or Seed Default Mentors.</td>
                            </tr>
                        ) : (
                            mentors.map((mentor) => (
                                <tr key={mentor.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <img src={mentor.image_url} alt={mentor.name} className="h-12 w-12 rounded-full object-cover border" />
                                    </td>
                                    <td className="p-3 font-semibold text-gray-800">{mentor.name}</td>
                                    <td className="p-3 text-gray-600">{mentor.subject}</td>
                                    <td className="p-3 text-sm text-gray-500 truncate max-w-xs" title={mentor.description}>
                                        {mentor.description.substring(0, 60)}{mentor.description.length > 60 ? '...' : ''}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${mentor.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {mentor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3 flex space-x-3">
                                        <button onClick={() => handleEdit(mentor)} className="text-blue-600 hover:text-blue-800" title="Edit"><FaEdit /></button>
                                        <button onClick={() => handleDelete(mentor.id)} className="text-red-500 hover:text-red-700" title="Delete"><FaTrash /></button>
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

export default Mentors;
