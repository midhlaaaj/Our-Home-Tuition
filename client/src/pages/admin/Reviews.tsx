import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaEdit, FaMagic, FaUpload } from 'react-icons/fa';
import { uploadFile } from '../../utils/uploadHelper';

interface Review {
    id: string;
    name: string;
    role: string;
    rating: number;
    message: string;
    avatar_url: string;
    is_active: boolean;
}

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<Partial<Review>>({ role: 'Student', rating: 5, is_active: true });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);



    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);

        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const publicUrl = await uploadFile(file, 'uploads', 'reviews');
            setForm(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload avatar. Make sure the "uploads" bucket exists and is public.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const reviewData = {
                name: form.name,
                role: form.role,
                rating: form.rating,
                message: form.message,
                avatar_url: form.avatar_url,
                is_active: form.is_active
            };

            if (isEditing && editId) {
                const { error } = await supabase
                    .from('reviews')
                    .update(reviewData)
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('reviews')
                    .insert([reviewData]);
                if (error) throw error;
            }

            setForm({ role: 'Student', rating: 5, is_active: true, name: '', message: '', avatar_url: '' });
            setIsEditing(false);
            setEditId(null);
            fetchReviews();
        } catch (err) {
            console.error('Error saving review:', err);
            alert('Failed to save review. Make sure the database table exists.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure?')) {
            try {
                const { error } = await supabase
                    .from('reviews')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                fetchReviews();
            } catch (err) {
                console.error('Error deleting review:', err);
            }
        }
    };

    const handleEdit = (review: Review) => {
        setForm(review);
        setIsEditing(true);
        setEditId(review.id);
    };

    const handleSeed = async () => {
        if (!window.confirm('This will add sample reviews using the format you requested. Proceed?')) return;

        const sampleReviews = [
            {
                name: "Sarah Thompson",
                role: "Project Manager",
                rating: 5,
                message: "This AI product has transformed the way I manage my daily tasks. It's intuitive, fast, and incredibly accurate!",
                avatar_url: "https://randomuser.me/api/portraits/women/44.jpg",
                is_active: true
            },
            {
                name: "Michael Chen",
                role: "Software Developer",
                rating: 5,
                message: "I was skeptical at first, but this AI tool saved me hours of work. The automation features are a game-changer.",
                avatar_url: "https://randomuser.me/api/portraits/men/32.jpg",
                is_active: true
            },
            {
                name: "Emily Rodriguez",
                role: "Data Analyst",
                rating: 5,
                message: "The AI's ability to analyze data and provide insights is unmatched. It's like having a personal assistant 24/7.",
                avatar_url: "https://randomuser.me/api/portraits/women/65.jpg",
                is_active: true
            },
            {
                name: "David Patel",
                role: "IT Consultant",
                rating: 5,
                message: "I've never seen an AI product this user-friendly. It integrated seamlessly into my workflow from day one.",
                avatar_url: "https://randomuser.me/api/portraits/men/86.jpg",
                is_active: true
            },
            {
                name: "Olivia Harper",
                role: "Marketing Specialist",
                rating: 5,
                message: "This AI has boosted my productivity tenfold. The predictive features are spot-on and so helpful!",
                avatar_url: "https://randomuser.me/api/portraits/women/24.jpg",
                is_active: true
            },
            {
                name: "James Carter",
                role: "Operations Manager",
                rating: 4,
                message: "The customer support for this AI product is phenomenal. Fast and delivers results every time.",
                avatar_url: "https://randomuser.me/api/portraits/men/11.jpg",
                is_active: true
            }
        ];

        try {
            const { error } = await supabase.from('reviews').insert(sampleReviews);
            if (error) throw error;
            fetchReviews();
            alert('Sample reviews added!');
        } catch (err) {
            console.error('Error seeding reviews:', err);
            alert('Failed to seed. Table might be missing.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Reviews</h1>
                <button
                    onClick={handleSeed}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                    <FaMagic /> Seed Sample Data
                </button>
            </div>



            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Review' : 'Add New Review'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Name"
                        className="border p-2 rounded"
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Role (e.g., Parent, Student, Job Title)"
                        className="border p-2 rounded"
                        value={form.role || ''}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Rating (1-5)"
                        className="border p-2 rounded"
                        value={form.rating || 5}
                        min="1" max="5"
                        onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
                    />

                    {/* Avatar Upload */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Avatar URL (Optional)"
                                className="border p-2 rounded w-full"
                                value={form.avatar_url || ''}
                                onChange={e => setForm({ ...form, avatar_url: e.target.value })}
                            />
                            <label className="flex items-center justify-center p-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200">
                                <FaUpload />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        {uploading && <span className="text-sm text-blue-500">Uploading...</span>}
                        {form.avatar_url && (
                            <img src={form.avatar_url} alt="Preview" className="h-10 w-10 rounded-full object-cover border bg-gray-50" />
                        )}
                    </div>

                    <textarea
                        placeholder="Message"
                        className="border p-2 rounded col-span-2"
                        value={form.message || ''}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        required
                    />
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={form.is_active}
                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <label>Active</label>
                    </div>

                    <button type="submit" disabled={uploading} className="bg-[#ffb76c] text-white p-2 rounded col-span-2 hover:bg-orange-400 disabled:opacity-50">
                        {isEditing ? 'Update Review' : 'Add Review'}
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => { setIsEditing(false); setForm({ role: 'Student', rating: 5, is_active: true, name: '', message: '', avatar_url: '' }); }}
                            className="bg-gray-500 text-white p-2 rounded col-span-2"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            {/* List */}
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="border-b">

                                <th className="p-2">Name</th>
                                <th className="p-2">Role</th>
                                <th className="p-2">Rating</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.id} className="border-b hover:bg-gray-50">

                                    <td className="p-2 flex items-center gap-2">
                                        <img src={review.avatar_url || `https://ui-avatars.com/api/?name=${review.name}`} className="w-8 h-8 rounded-full" alt="" />
                                        {review.name}
                                    </td>
                                    <td className="p-2">{review.role}</td>
                                    <td className="p-2">{review.rating}/5</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs text-white ${review.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {review.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-2 flex space-x-2">
                                        <button onClick={() => handleEdit(review)} className="text-blue-500 hover:text-blue-700"><FaEdit /></button>
                                        <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && reviews.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">No reviews found. Try seeding data!</p>
                )}
            </div>
        </div>
    );
};

export default Reviews;
