import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { FaUser, FaHistory, FaSignOutAlt, FaPen, FaSave, FaCamera, FaCalendarAlt, FaChevronRight, FaGraduationCap, FaHome } from 'react-icons/fa';
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { useModal } from '../context/ModalContext';

interface Booking {
    id: string;
    created_at: string;
    class_id: number;
    curriculum: string;
    selected_units: { subject_id: string, topic_id: string, subject_name?: string, topic_name?: string }[];
    status: string;
    class_type: string;
}

const Profile: React.FC = () => {
    const { user, signOut } = useAuth();
    const { showAlert, showSuccess } = useModal();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const [editForm, setEditForm] = useState({
        displayName: '',
        role: '',
        class: '',
        phone: '',
        address: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setEditForm({
                displayName: user.user_metadata?.full_name || '',
                role: user.user_metadata?.role || 'Student',
                class: user.user_metadata?.class || '',
                phone: user.user_metadata?.phone || '',
                address: user.user_metadata?.address || '',
                email: user.email || ''
            });

            const fetchBookings = async () => {
                try {
                    const { data, error } = await supabase
                        .from('bookings')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setBookings(data || []);
                } catch (err) {
                    console.error("Error fetching bookings:", err);
                } finally {
                    setLoading(false);
                }
            };

            fetchBookings();
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const updateParams: any = {
                data: {
                    full_name: editForm.displayName,
                    role: editForm.role,
                    class: editForm.class,
                    phone: editForm.phone,
                    address: editForm.address
                }
            };

            if (editForm.email && editForm.email !== user.email) {
                updateParams.email = editForm.email;
            }

            const { error } = await supabase.auth.updateUser(updateParams);
            
            if (error) throw error;
            
            if (updateParams.email) {
                showSuccess("Confirmation email sent to " + editForm.email + ". Please verify to complete the change.");
            }
            
            setIsEditing(false);
        } catch (err: any) {
            showAlert("Failed to update profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpdate = async () => {
        await supabase.auth.refreshSession();
        setIsAvatarModalOpen(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col pt-32">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Please sign in to view your profile</h2>
                    <p className="text-gray-500 mt-2 mb-8">Access your account details and booking history.</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-24">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-8 flex items-center gap-3 text-gray-400 hover:text-[#a0522d] transition-all group"
                    >
                        <div className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaHome size={18} />
                        </div>
                        <span className="text-sm font-bold text-[#1B2A5A]">Back to Home</span>
                    </button>

                    <h1 className="text-4xl font-black text-gray-900 mb-12">My Account</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Side Profile Card */}
                        <div className="lg:col-span-4 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center">
                            <div className="relative group mb-8">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#ffb76c]/30 shadow-inner flex items-center justify-center bg-gray-50">
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[#a0522d] text-4xl font-black">{user.email?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="absolute bottom-0 right-0 bg-[#a0522d] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform border-4 border-white"
                                >
                                    <FaCamera size={16} />
                                </button>
                            </div>

                            <div className="text-center w-full mb-10">
                                <h2 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
                                    {user.user_metadata?.full_name || "New User"}
                                </h2>
                                <p className="text-gray-400 font-medium">{user.email}</p>
                            </div>

                            <div className="w-full space-y-3">
                                {isEditing ? (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="w-full py-4 bg-[#a0522d] text-white rounded-2xl font-black shadow-lg hover:shadow-orange-900/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FaSave /> Save Changes</>}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="w-full py-4 border-2 border-gray-200 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-black hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaPen size={14} /> Edit Profile
                                        </button>
                                        <button
                                            onClick={() => signOut()}
                                            className="w-full py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaSignOutAlt /> Sign Out
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-12">

                            {/* Account Details Form - Only shown when editing */}
                            {isEditing && (
                                <section className="bg-white p-10 lg:p-14 rounded-[40px] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <h3 className="text-2xl font-black text-gray-800 mb-10 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-orange-50 text-[#a0522d] rounded-xl flex items-center justify-center"><FaUser size={18} /></div>
                                        Edit Personal Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                name="displayName"
                                                value={editForm.displayName}
                                                onChange={e => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl px-5 py-4 font-bold text-gray-800 outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Current Class</label>
                                            <input
                                                type="text"
                                                name="class"
                                                value={editForm.class}
                                                onChange={e => setEditForm(prev => ({ ...prev, class: e.target.value }))}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl px-5 py-4 font-bold text-gray-800 outline-none transition-all"
                                                placeholder="e.g. 10th Grade"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Phone Number</label>
                                            <div className="relative group flex items-center bg-gray-50 border-2 border-transparent focus-within:border-[#a0522d] focus-within:bg-white rounded-2xl transition-all overflow-hidden">
                                                <div className="flex items-center pl-5 pr-3 text-gray-400 border-r border-gray-100 py-4 h-full">
                                                    <span className="font-black text-sm">+91</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={editForm.phone}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setEditForm(prev => ({ ...prev, phone: val }));
                                                    }}
                                                    className="w-full px-4 py-4 bg-transparent font-bold text-gray-800 outline-none"
                                                    placeholder="00000 00000"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Email</label>
                                            <input
                                                type="email"
                                                id="profile-email"
                                                name="email"
                                                value={editForm.email}
                                                onChange={e => {
                                                    const newEmail = e.target.value;
                                                    setEditForm(prev => ({ ...prev, email: newEmail }));
                                                }}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl px-5 py-4 font-bold text-gray-800 outline-none transition-all cursor-text"
                                                placeholder="name@email.com"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-sm font-bold text-[#1B2A5A] ml-1">Primary Address</label>
                                            <textarea
                                                rows={3}
                                                name="address"
                                                value={editForm.address}
                                                onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl px-5 py-4 font-bold text-gray-800 outline-none transition-all resize-none"
                                                placeholder="Enter your address"
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Booking History Section */}
                            <section className="bg-[#1F2937] p-8 lg:p-12 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 bg-white/10 text-[#ffb76c] rounded-xl flex items-center justify-center"><FaCalendarAlt size={18} /></div>
                                    Booking History
                                </h3>

                                <div className="space-y-6 relative z-10">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10">
                                            <div className="w-10 h-10 border-4 border-white/20 border-t-[#ffb76c] rounded-full animate-spin mb-4" />
                                            <p className="font-bold text-white/50">Fetching your sessions...</p>
                                        </div>
                                    ) : bookings.length > 0 ? (
                                        bookings.map((booking) => (
                                            <div key={booking.id} className="bg-white/5 border border-white/10 p-6 lg:p-8 rounded-[32px] group hover:bg-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-[#ffb76c] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-orange-500/10 transition-transform group-hover:scale-105">
                                                        <FaGraduationCap size={28} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="text-xl font-black text-white">Class {booking.class_id}</h4>
                                                            <span className="text-[10px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-full uppercase tracking-tighter">{booking.curriculum}</span>
                                                        </div>
                                                        <p className="text-gray-400 font-bold text-sm">
                                                            {booking.selected_units.length} Unit(s) • {booking.class_type === 'individual' ? '1-on-1 Session' : 'Group Session'}
                                                        </p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                                                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-white/10 text-white/40'
                                                                }`}>
                                                                {booking.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <p className="text-xs font-black text-white/30 uppercase tracking-widest">{new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <button className="flex items-center gap-2 text-[#ffb76c] font-black text-sm group/btn hover:text-white transition-colors">
                                                        View Details <FaChevronRight size={10} className="transition-transform group-hover/btn:translate-x-1" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                                            <div className="w-12 h-12 bg-white/5 text-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <FaHistory size={20} />
                                            </div>
                                            <h4 className="text-lg font-bold text-white mb-1">No bookings yet</h4>
                                            <p className="text-white/40 text-sm max-w-xs mx-auto mb-6">You haven't booked any tutoring sessions.</p>
                                            <button
                                                onClick={() => navigate('/class/1')}
                                                className="bg-[#ffb76c] text-black px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-[#ffa043] transition-all transform hover:-translate-y-1 active:scale-95 text-sm"
                                            >
                                                Book Your First Session
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {isAvatarModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden h-[600px] max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-300">
                        <AvatarSelectionModal
                            isOpen={isAvatarModalOpen}
                            onBack={() => setIsAvatarModalOpen(false)}
                            onUpdate={handleAvatarUpdate}
                            currentAvatarUrl={user.user_metadata?.avatar_url}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
