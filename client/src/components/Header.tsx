import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useCurriculum } from '../context/CurriculumContext';
import { FaSignOutAlt, FaBell, FaChevronDown, FaPen, FaTimes, FaSave, FaCamera } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import AvatarSelectionModal from './AvatarSelectionModal';

import SignIn from './SignIn';

interface HeaderProps {
    bgClass?: string;
    showToggle?: boolean;
}

const Header: React.FC<HeaderProps> = ({ bgClass, showToggle = true }) => {
    const { curriculum, toggleCurriculum } = useCurriculum();
    const { user, signOut } = useAuth();
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        role: '',
        class: '',
        phone: '',
        email: '',
        address: ''
    });
    const lastScrollY = useRef(0);
    const modalRef = useRef<HTMLDivElement>(null);

    // Initialize form when profile opens or user changes
    useEffect(() => {
        if (user) {
            setEditForm({
                displayName: user.user_metadata?.full_name || '',
                role: user.user_metadata?.role || 'Student',
                class: user.user_metadata?.class || '',
                phone: user.user_metadata?.phone || '',
                email: user.email || '',
                address: user.user_metadata?.address || ''
            });
        }
    }, [user, isProfileOpen]);

    const handleSignOut = async () => {
        await signOut();
        setIsProfileOpen(false);
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        // Reset form if cancelling edit
        if (isEditing && user) {
            setEditForm({
                displayName: user.user_metadata?.full_name || '',
                role: user.user_metadata?.role || 'Student',
                class: user.user_metadata?.class || '',
                phone: user.user_metadata?.phone || '',
                email: user.email || '',
                address: user.user_metadata?.address || ''
            });
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: editForm.displayName,
                    role: editForm.role,
                    class: editForm.class,
                    phone: editForm.phone,
                    address: editForm.address
                    // Email cannot be updated via this method usually, requires separate process
                }
            });

            if (error) {
                console.error("Error updating profile:", error);
                alert("Failed to update profile: " + error.message);
            } else {
                console.log("Profile updated successfully");
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Unexpected error updating profile:", err);
            alert("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    // Scroll Lock when Profile is Open
    useEffect(() => {
        if (isProfileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setIsEditing(false); // Reset edit mode when closing
            const timer = setTimeout(() => setIsAvatarModalOpen(false), 300); // Reset avatar view after animation
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isProfileOpen]);


    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Determine dynamic threshold based on viewport height (Hero section is min-h-[90vh], so ~85vh is a good switch point)
            const heroHeightThreshold = window.innerHeight * 0.85;

            // Scrolled state for style changes (blur etc)
            if (currentScrollY > heroHeightThreshold) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }

            // Visibility logic - always show the header as sticky throughout the website
            setIsHeaderVisible(true);

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed w-full top-0 z-50 transition-all duration-300 ease-in-out transform ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
                } ${bgClass ? bgClass : isScrolled
                    ? 'bg-[#ffb76c]/95 backdrop-blur-md shadow-lg border-b border-[#ffb76c]/20'
                    : 'bg-white/10 backdrop-blur-md shadow-sm border-b border-white/10'
                }`}
        >
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Left Side: Logo & Brand */}
                <Link to="/" className="flex items-center space-x-2">
                    {/* Placeholder for Logo */}
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#ffb76c] font-bold text-xl shadow-sm">
                        HT
                    </div>
                    <span className="text-white text-xl font-bold tracking-wide drop-shadow-sm">
                        Our Home Tuition
                    </span>
                </Link>

                {/* Right Side: Toggle & Auth */}
                <div className="flex items-center space-x-4">
                    {/* Toggle Button */}
                    {showToggle && (
                        <button
                            onClick={toggleCurriculum}
                            className="relative w-32 h-10 bg-[#e69b48] rounded-full flex items-center p-1 cursor-pointer shadow-inner overflow-hidden border border-[#d68a3a]/40"
                            aria-label="Toggle Curriculum"
                        >
                            {/* Background Text Labels */}
                            <div className="absolute w-full flex justify-between px-3 text-xs font-bold text-[#0f1020]/70 pointer-events-none select-none">
                                <span>CBSE</span>
                                <span>STATE</span>
                            </div>

                            {/* Slider Knob */}
                            <div
                                className={`w-1/2 h-full bg-[#0f1020] rounded-full shadow-md text-white flex items-center justify-center text-xs font-bold transition-transform duration-300 ease-in-out ${curriculum === 'STATE' ? 'translate-x-full' : 'translate-x-0'
                                    }`}
                            >
                                {curriculum}
                            </div>
                        </button>
                    )}

                    {/* Auth Section */}
                    {user ? (
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <button className="w-10 h-10 rounded-full bg-[#e69b48] border border-[#d68a3a]/40 flex items-center justify-center text-[#0f1020] hover:bg-[#d68a3a] transition-all shadow-sm">
                                <FaBell size={18} />
                            </button>

                            {/* Crown Icon (Premium) Removed */}


                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="h-10 flex items-center gap-3 bg-[#e69b48] text-[#0f1020] px-2 pr-4 rounded-full hover:bg-[#d68a3a] transition-all border border-[#d68a3a]/40 shadow-sm"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border-2 border-white/50 flex-shrink-0">
                                        {user.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white text-[#ffb76c] font-bold">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center pr-2">
                                        <span className="text-sm font-bold leading-tight text-[#0f1020] drop-shadow-none">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </span>
                                        <span className="text-[10px] text-[#0f1020]/80 font-bold leading-none mt-0.5 bg-white/30 px-1.5 py-0.5 rounded-full border border-white/20">
                                            {user.user_metadata?.role || "Student"}
                                        </span>
                                    </div>
                                    <FaChevronDown size={12} className={`text-[#0f1020]/80 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* Centered Profile Modal - Updated to use Portal */}
                            {isProfileOpen && ReactDOM.createPortal(
                                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                                        onClick={() => setIsProfileOpen(false)}
                                    />

                                    {/* Modal Content */}
                                    <div
                                        ref={modalRef}
                                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col z-50"
                                    >
                                        {!isAvatarModalOpen ? (
                                            <>
                                                {/* Top Controls */}
                                                {!isEditing && (
                                                    <div className="absolute top-4 left-4 z-10">
                                                        <button
                                                            onClick={handleEditToggle}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100/50"
                                                            title="Edit Profile"
                                                        >
                                                            <FaPen size={15} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 z-10">
                                                    <button
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100/50"
                                                    >
                                                        <FaTimes size={18} />
                                                    </button>
                                                </div>

                                                {/* Avatar & Name Section */}
                                                <div className="pt-8 pb-5 px-6 shrink-0 flex flex-col items-center">
                                                    <div className="relative w-20 h-20 mb-3 group">
                                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#ffb76c]/50 shadow-sm flex items-center justify-center bg-gray-50">
                                                            {user?.user_metadata?.avatar_url ? (
                                                                <img
                                                                    src={user.user_metadata.avatar_url}
                                                                    alt="Profile"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-[#a0522d] text-3xl font-bold font-sans">
                                                                    {user?.email?.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => setIsAvatarModalOpen(true)}
                                                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity cursor-pointer z-10"
                                                            >
                                                                <FaCamera className="text-white text-xl drop-shadow-md" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Name (Editable) */}
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            name="displayName"
                                                            value={editForm.displayName}
                                                            onChange={handleChange}
                                                            className="bg-transparent text-gray-900 text-center font-bold text-xl placeholder-gray-400 border-b border-gray-300 focus:outline-none focus:border-[#a0522d] w-3/4 pb-1"
                                                            placeholder="Your Name"
                                                        />
                                                    ) : (
                                                        <h3 className="text-xl font-bold text-gray-900 tracking-wide">
                                                            {user?.user_metadata?.full_name || "User Name"}
                                                        </h3>
                                                    )}
                                                </div>

                                                {/* Details List */}
                                                <div className="bg-white px-6 pb-6 relative flex-1 overflow-y-auto">
                                                    <div className="space-y-4">
                                                        {/* Role */}
                                                        <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                            <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Role</span>
                                                            {isEditing ? (
                                                                <select
                                                                    name="role"
                                                                    value={editForm.role}
                                                                    onChange={handleChange}
                                                                    className="text-gray-800 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#a0522d] px-3 py-2 rounded-lg w-full border border-gray-200 focus:border-[#a0522d] outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                                                >
                                                                    <option value="Student">Student</option>
                                                                    <option value="Parent">Parent</option>
                                                                </select>
                                                            ) : (
                                                                <span className="text-gray-800 font-medium text-sm">{user?.user_metadata?.role || "Student"}</span>
                                                            )}
                                                        </div>

                                                        {/* Class */}
                                                        <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                            <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Class</span>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    name="class"
                                                                    value={editForm.class}
                                                                    onChange={handleChange}
                                                                    className="text-gray-800 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#a0522d] px-3 py-2 rounded-lg w-full border border-gray-200 focus:border-[#a0522d] outline-none transition-all shadow-sm"
                                                                    placeholder="e.g. 10th Grade"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-800 font-medium text-sm">{user?.user_metadata?.class || "Not Set"}</span>
                                                            )}
                                                        </div>

                                                        {/* Mobile */}
                                                        <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                            <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Mobile</span>
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    name="phone"
                                                                    value={editForm.phone}
                                                                    onChange={handleChange}
                                                                    className="text-gray-800 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#a0522d] px-3 py-2 rounded-lg w-full border border-gray-200 focus:border-[#a0522d] outline-none transition-all shadow-sm"
                                                                    placeholder="+91..."
                                                                />
                                                            ) : (
                                                                <span className="text-gray-800 font-medium text-sm">{user?.user_metadata?.phone || "Not Set"}</span>
                                                            )}
                                                        </div>

                                                        {/* Email */}
                                                        <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                            <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Email</span>
                                                            <span className="text-gray-800 font-medium text-sm truncate w-full">{user?.email}</span>
                                                        </div>

                                                        {/* Address */}
                                                        <div className="flex flex-col gap-1 border-b border-gray-100 pb-2">
                                                            <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Address</span>
                                                            {isEditing ? (
                                                                <textarea
                                                                    name="address"
                                                                    value={editForm.address}
                                                                    onChange={handleChange}
                                                                    rows={2}
                                                                    className="text-gray-800 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#a0522d] px-3 py-2 rounded-lg w-full border border-gray-200 focus:border-[#a0522d] outline-none transition-all resize-none shadow-sm"
                                                                    placeholder="Enter your full address"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-800 font-medium text-sm leading-relaxed">{user?.user_metadata?.address || "Not Set"}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="bg-white px-6 pb-6 pt-2 relative z-10">
                                                    {isEditing ? (
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={handleEditToggle}
                                                                disabled={isSaving}
                                                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                            >
                                                                <FaTimes /> Cancel
                                                            </button>
                                                            {(() => {
                                                                const hasChanges = user ? (
                                                                    (editForm.displayName || '') !== (user.user_metadata?.full_name || '') ||
                                                                    (editForm.class || '') !== (user.user_metadata?.class || '') ||
                                                                    (editForm.phone || '') !== (user.user_metadata?.phone || '') ||
                                                                    (editForm.address || '') !== (user.user_metadata?.address || '') ||
                                                                    (editForm.role || '') !== (user.user_metadata?.role || '')
                                                                ) : false;

                                                                return (
                                                                    <button
                                                                        onClick={handleSaveProfile}
                                                                        disabled={isSaving || !hasChanges}
                                                                        className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${isSaving || !hasChanges
                                                                            ? 'bg-[#cc8e71] cursor-not-allowed'
                                                                            : 'bg-[#a0522d] hover:bg-[#804224]'
                                                                            }`}
                                                                    >
                                                                        {isSaving ? (
                                                                            <>
                                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                                Saving...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <FaSave /> Save Changes
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={handleSignOut}
                                                            className="w-full py-2.5 border border-gray-200 hover:bg-red-50 text-gray-700 hover:text-red-500 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 group shadow-sm"
                                                        >
                                                            <FaSignOutAlt className="group-hover:rotate-180 transition-transform duration-300 text-gray-400 group-hover:text-red-400" />
                                                            Sign Out
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <AvatarSelectionModal
                                                isOpen={true}
                                                onBack={() => setIsAvatarModalOpen(false)}
                                                onUpdate={async () => {
                                                    const { error } = await supabase.auth.refreshSession();
                                                    if (error) console.error("Session refresh error", error);
                                                    setIsAvatarModalOpen(false);
                                                }}
                                                currentAvatarUrl={user?.user_metadata?.avatar_url}
                                            />
                                        )}
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setAuthView('signin'); setIsAuthModalOpen(true); }}
                                className={`bg-transparent px-4 py-2 font-bold text-sm transition-colors ${isScrolled ? 'text-[#0f1020] hover:text-[#1a1c2e]' : 'text-white hover:text-gray-200'
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setAuthView('signup'); setIsAuthModalOpen(true); }}
                                className="bg-[#0f1020] text-white px-5 py-2 rounded-full font-bold text-sm shadow-md hover:bg-[#1a1c2e] transition-colors border border-white/20"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <SignIn isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authView} />
        </header>
    );
};

export default Header;
