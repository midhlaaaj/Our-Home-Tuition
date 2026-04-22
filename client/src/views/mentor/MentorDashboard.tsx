"use client";

import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../../context/AuthContext';
import BrandedLoading from '../../components/BrandedLoading';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FaUser, FaCheckCircle, FaTrash, FaClock, FaHistory, FaPlus, FaBell,
    FaTimes, FaCalendarAlt, FaWifi, FaHome, FaLinkedin, FaGraduationCap, 
    FaBriefcase, FaStar, FaPen, FaSave, FaChevronDown, FaSignOutAlt, FaCalendarCheck, FaMapMarkerAlt, FaBars, FaInfoCircle, FaEye, FaEyeSlash,
    FaChevronLeft, FaChevronRight, FaLock
} from 'react-icons/fa';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval
} from 'date-fns';
import { useModal } from '../../context/ModalContext';

interface MentorProfile {
    id: string;
    name: string;
    subject: string;
    description: string;
    image_url: string;
    email: string;
    contact_no: string;
    linkedin_url: string;
    qualification: string;
    work_history: string;
    rating: number;
    latitude?: number | null;
    longitude?: number | null;
    location_address?: string;
}

interface Availability {
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface Task {
    id: string;
    name: string;
    email: string;
    phone: string;
    query?: string;
    created_at: string;
    is_accepted: boolean;
    type: 'query' | 'booking';
    curriculum?: string;
    class_id?: number;
    status?: string;
    preferred_date?: string | null;
    preferred_time?: string | null;
    session_mode?: string;
    selected_units?: any[];
    is_rescheduled?: boolean;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    mentor_id: string;
}

const MentorDashboard: React.FC = () => {
    const { user, signOut, supabaseClient: supabase } = useAuth();
    const router = useRouter();
    const { showAlert, showConfirm, showSuccess } = useModal();
    const [profile, setProfile] = useState<MentorProfile | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'tasks' | 'offers' | 'history' | 'security' | 'calendar' | 'incentives' | 'assignments' | 'notifications'>(() => {
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem('mentor_dashboard_tab');
            return (saved as any) || 'profile';
        }
        return 'profile';
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [visibleTasksCount, setVisibleTasksCount] = useState(5);
    const [nearbyOffers, setNearbyOffers] = useState<any[]>([]);
    const [assignmentOffers, setAssignmentOffers] = useState<any[]>([]);
    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));


    const [editForm, setEditForm] = useState({
        name: '',
        subject: '',
        description: '',
        linkedin_url: '',
        qualification: '',
        work_history: '',
        location_address: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    // Form states for availability
    const [newSlot, setNewSlot] = useState({
        day_of_week: 'Monday',
        start_hour: '09',
        start_min: '00',
        start_ampm: 'AM',
        end_hour: '10',
        end_min: '00',
        end_ampm: 'AM'
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    
    // Incentive states
    const [offlineSessionCount, setOfflineSessionCount] = useState(0);

    useEffect(() => {
        if (activeTab) {
            localStorage.setItem('mentor_dashboard_tab', activeTab);
        }
    }, [activeTab]);

    useEffect(() => {
        // Only run on initial load or if user actually changes.
        // This prevents the "auto-reload" when switching browser tabs (AuthContext sync).
        if (user?.id && (isInitialLoad || !profile)) {
            fetchMentorData();
            setIsInitialLoad(false);
        }
    }, [user?.id]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real-time notifications for Mentor
    useEffect(() => {
        if (!profile?.id) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('mentor_notifications')
                .select('*')
                .eq('mentor_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setNotifications(data as Notification[]);
                setUnreadCount((data as Notification[]).filter((n: Notification) => !n.is_read).length);
            }
        };

        fetchNotifications();

        const channel = supabase
            .channel(`mentor-notifs-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mentor_notifications',
                    filter: `mentor_id=eq.${profile.id}`
                },
                (payload: any) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    // Real-time subscription for Incentives
    useEffect(() => {
        if (!user?.id || !profile?.id) return;

        const channel = supabase
            .channel('mentor_incentive_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `assigned_mentor_id=eq.${profile.id}`
                },
                (payload: any) => {
                    console.log('Realtime update received:', payload);
                    // If a booking is marked completed, refresh data
                    if (payload.new.status === 'completed') {
                        fetchMentorData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, profile?.id]);

    const handleValidateOTP = async (taskId: string, enteredOtp: string) => {
        setProcessingTaskId(taskId);
        try {
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('otp')
                .eq('id', taskId)
                .single();

            if (fetchError || !booking) throw new Error("Could not verify OTP");

            if (booking.otp === enteredOtp) {
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ 
                        status: 'completed'
                    })
                    .eq('id', taskId);

                if (updateError) throw updateError;
                
                setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
                showSuccess("OTP Validated! Session marked as completed.");
            } else {
                showAlert("Invalid OTP. Please check with the parent.");
            }
        } catch (err: any) {
            console.error("OTP validation error:", err);
            showAlert("Error: " + err.message);
        } finally {
            setProcessingTaskId(null);
        }
    };
    
    const handleRaiseInvoice = async () => {
        if (!profile || offlineSessionCount < 10) return;
        
        setIsSaving(true);
        try {
            // Get the 10 oldest completed offline bookings that are not claimed
            const { data: bookingsToClaim, error: fetchError } = await supabase
                .from('bookings')
                .select('id')
                .eq('assigned_mentor_id', profile.id)
                .eq('status', 'completed')
                .or('session_mode.eq.offline,session_mode.is.null')
                .eq('claimed_for_incentive', false)
                .order('created_at', { ascending: true })
                .limit(10);

            if (fetchError) throw fetchError;
            if (!bookingsToClaim || bookingsToClaim.length < 10) {
                showAlert("Not enough qualifying sessions found to raise an invoice.");
                return;
            }

            const bookingIds = bookingsToClaim.map((b: any) => b.id);

            // 1. Create the incentive claim
            const { error: claimError } = await supabase
                .from('incentive_claims')
                .insert([{
                    mentor_id: profile.id,
                    amount: 1000,
                    status: 'pending',
                    booking_ids: bookingIds
                }]);

            if (claimError) throw claimError;

            // 2. Mark bookings as claimed
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ claimed_for_incentive: true })
                .in('id', bookingIds);

            if (updateError) throw updateError;

            showSuccess("Invoice raised successfully! Your incentive bar has been reset.");
            fetchMentorData(); // Refresh counts
        } catch (err: any) {
            console.error('Error raising invoice:', err);
            showAlert(`Failed to raise invoice: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchMentorData = async () => {
        // Only set loading true if it's the first time we're fetching
        if (!profile) setLoading(true);
        try {
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentors')
                .select('*')
                .eq('auth_user_id', user?.id)
                .single();

            if (mentorError) throw mentorError;
            if (mentorData) {
                setProfile(mentorData);
                // Call with fresh data immediately
                fetchNearbyOffers(mentorData);
                setEditForm({
                    name: mentorData.name || '',
                    subject: mentorData.subject || '',
                    description: mentorData.description || '',
                    linkedin_url: mentorData.linkedin_url || '',
                    qualification: mentorData.qualification || '',
                    work_history: mentorData.work_history || '',
                    location_address: mentorData.location_address || '',
                    latitude: mentorData.latitude || null,
                    longitude: mentorData.longitude || null
                });

                // Helper to enrich unit numbers for legacy data
                const enrichBookings = async (data: any[]) => {
                    if (!data || data.length === 0) return data;
                    const topicsToFetch = new Set<string>();
                    data.forEach(b => {
                        b.selected_units?.forEach((u: any) => {
                            if (u.topic_id && (u.unit_no === undefined || u.unit_no === null)) {
                                topicsToFetch.add(u.topic_id);
                            }
                        });
                    });

                    if (topicsToFetch.size === 0) return data;

                    const { data: topicMappings } = await supabase
                        .from('class_topics')
                        .select('id, unit_no')
                        .in('id', Array.from(topicsToFetch));

                    if (!topicMappings) return data;

                    const mappingDict = topicMappings.reduce((acc: any, t: any) => ({
                        ...acc,
                        [t.id]: t.unit_no
                    }), {});

                    return data.map(b => ({
                        ...b,
                        selected_units: b.selected_units?.map((u: any) => ({
                            ...u,
                            unit_no: (u.unit_no !== undefined && u.unit_no !== null) ? u.unit_no : mappingDict[u.topic_id]
                        }))
                    }));
                };

                const [availData, queryData, rawBookings, rawOffers] = await Promise.all([
                    supabase.from('mentor_availability').select('*').eq('mentor_id', mentorData.id),
                    supabase.from('contact_queries').select('*').eq('assigned_mentor_id', mentorData.id),
                    supabase.from('bookings').select('*').eq('assigned_mentor_id', mentorData.id).order('created_at', { ascending: false }),
                    supabase.from('mentor_assignment_offers').select('*, booking:bookings(*)').eq('mentor_id', mentorData.id).eq('status', 'pending')
                ]);

                setAvailability(availData.data || []);
                
                const enrichedBookings = await enrichBookings(rawBookings.data || []);
                const enrichedOffers = await Promise.all((rawOffers.data || []).map(async (offer: any) => {
                    if (offer.booking) {
                        const [enriched] = await enrichBookings([offer.booking]);
                        return { ...offer, booking: enriched };
                    }
                    return offer;
                }));

                const formattedQueries = (queryData.data || []).map((q: any) => ({ ...q, type: 'query' as const }));
                const formattedBookings = (enrichedBookings || []).map((b: any) => ({
                    ...b,
                    name: b.primary_student?.name,
                    email: b.primary_student?.email,
                    phone: b.primary_student?.phone,
                    type: 'booking' as const,
                    status: b.status,
                    preferred_date: b.preferred_date,
                    preferred_time: b.preferred_time,
                    session_mode: b.session_mode,
                    is_rescheduled: b.is_rescheduled
                }));

                const combinedTasks = [...formattedQueries, ...formattedBookings];
                combinedTasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setTasks(combinedTasks);
                setAssignmentOffers(enrichedOffers || []);

                const offlineCount = (rawBookings.data || []).filter((b: any) => 
                    b.status === 'completed' && 
                    (b.session_mode === 'offline' || !b.session_mode) &&
                    !b.claimed_for_incentive
                ).length;
                setOfflineSessionCount(offlineCount);
            }
        } catch (err) {
            console.error('Error fetching mentor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNearbyOffers = async (mentorProfile: MentorProfile) => {
        if (!mentorProfile.latitude || !mentorProfile.longitude) {
            console.log("Discovery: Mentor has no coordinates pinned.");
            return;
        }

        console.log(`Discovery Step: Scanning for bookings near ${mentorProfile.latitude}, ${mentorProfile.longitude}`);

        try {
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select('*')
                .is('assigned_mentor_id', null)
                .eq('status', 'pending');

            if (error) throw error;

            console.log(`Discovery Step: Found ${bookings?.length || 0} unassigned pending bookings in DB.`);

            const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371; // km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const nearby = (bookings || [])
                .map((b: any) => {
                    const dist = b.latitude && b.longitude ? calculateDistance(mentorProfile.latitude!, mentorProfile.longitude!, b.latitude, b.longitude) : null;
                    if (dist !== null) {
                        console.log(`Booking ${b.id.slice(0, 5)}... is ${dist.toFixed(2)}km away (Coords: ${b.latitude}, ${b.longitude})`);
                    } else {
                        console.log(`Booking ${b.id.slice(0, 5)}... has NO coordinates.`);
                    }
                    return { ...b, distance: dist };
                })
                .filter((b: any) => b.distance !== null && b.distance <= 20) // 20km radius
                .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

            console.log(`Discovery Result: ${nearby.length} bookings within 20km.`);
            setNearbyOffers(nearby);
        } catch (err) {
            console.error('Error fetching nearby offers:', err);
        }
    };

    const handleAcceptAssignmentOffer = async (offer: any) => {
        if (!profile) return;
        setProcessingTaskId(offer.id);
        try {
            // 1. Double check if booking is still pending
            const { data: booking, error: fetchErr } = await supabase
                .from('bookings')
                .select('status')
                .eq('id', offer.booking_id)
                .single();
            
            if (fetchErr || !booking) throw new Error("Booking not found");
            if (booking.status !== 'pending') {
                showAlert("This assignment is no longer available.");
                setAssignmentOffers(assignmentOffers.filter(o => o.id !== offer.id));
                return;
            }

            // 2. Accept this offer
            const { error: offerErr } = await supabase
                .from('mentor_assignment_offers')
                .update({ status: 'accepted' })
                .eq('id', offer.id);
            if (offerErr) throw offerErr;

            // 3. Update the booking directly to CONFIRMED
            const { error: bookingErr } = await supabase
                .from('bookings')
                .update({ 
                    assigned_mentor_id: profile.id, // Use profile.id which is the mentor table ID
                    status: 'confirmed'
                })
                .eq('id', offer.booking_id);
            if (bookingErr) throw bookingErr;

            // 4. Notify Parent (User)
            const { error: notifError } = await supabase.from('notifications').insert({
                user_id: offer.booking?.user_id,
                title: 'Mentor Assigned!',
                message: `Great news! ${profile?.name} has accepted your booking request. Your session is confirmed. Session OTP: ${offer.booking?.otp || '---'}. instructions: Share the OTP with your mentor only during the session.`,
                type: 'booking_confirmed'
            });

            if (notifError) console.error("Notification failed:", notifError);

            // 5. Expire all other offers for this booking
            await supabase
                .from('mentor_assignment_offers')
                .update({ status: 'expired' })
                .eq('booking_id', offer.booking_id)
                .neq('id', offer.id)
                .eq('status', 'pending');

            showSuccess("Assignment confirmed! Parent has been notified with your details and the OTP.");
            setAssignmentOffers(assignmentOffers.filter(o => o.id !== offer.id));
            fetchMentorData();
        } catch (err: any) {
            console.error('Error accepting assignment offer:', err);
            showAlert("Error: " + err.message);
        } finally {
            setProcessingTaskId(null);
        }
    };

    const handleRejectAssignmentOffer = async (offerId: string) => {
        try {
            const { error } = await supabase
                .from('mentor_assignment_offers')
                .update({ status: 'rejected' })
                .eq('id', offerId);
            if (error) throw error;
            setAssignmentOffers(assignmentOffers.filter(o => o.id !== offerId));
            showSuccess("Request declined.");
        } catch (err) {
            console.error('Error rejecting offer:', err);
        }
    };

    const handleAcceptOffer = async (bookingId: string) => {
        if (!profile) return;
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ 
                    assigned_mentor_id: profile.id,
                    status: 'awaiting_approval' // Notify admin of interest
                })
                .eq('id', bookingId);

            if (error) throw error;
            
            showSuccess("Interest registered! Admin will review and confirm.");
            setNearbyOffers(nearbyOffers.filter(o => o.id !== bookingId));
            fetchMentorData(); // Refresh tasks
        } catch (err) {
            console.error('Error accepting offer:', err);
        }
    };

    const finalizeAcceptTask = async (taskId: string, singleTime: string, bookingData: any) => {
        if (!profile) return;

        // 1. Stop if already confirmed (Prevents duplicate notifications)
        if (bookingData.status === 'confirmed') {
            showAlert("This booking is already confirmed.");
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'confirmed'} : t));
            return;
        }

        // 2. OTP Recovery: Generate if missing
        let currentOtp = bookingData.otp;
        if (!currentOtp || currentOtp === '---') {
            currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
            await supabase
                .from('bookings')
                .update({ otp: currentOtp })
                .eq('id', taskId);
        }

        // 3. Confirm Booking
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'confirmed', preferred_time: singleTime }) // Shift time to preferred_time if specifically selected
            .eq('id', taskId);
        
        if (error) throw error;

        // 4. Notify Parent
        const { error: notifError } = await supabase.from('notifications').insert({
            user_id: bookingData.user_id,
            title: 'Booking Confirmed!',
            message: `Great news! ${profile?.name} has been assigned as your mentor. Your session is scheduled for ${singleTime}. Your Session OTP is: ${currentOtp}. ⚠️ Do not share this OTP at any other time except during the session.`,
            type: 'booking_confirmed'
        });

        if (notifError) {
            console.error("Notification Error:", notifError);
            showAlert("Task accepted, but failed to notify parent: " + notifError.message);
        } else {
            showSuccess("Task accepted and parent notified!");
        }
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'confirmed', preferred_time: singleTime } : t));
    };

    const handleAcceptTask = async (taskId: string, type: 'query' | 'booking') => {
        if (processingTaskId) return;
        setProcessingTaskId(taskId);
        try {
            if (type === 'booking') {
                const { data: bookingData, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('id', taskId)
                    .single();

                if (fetchError || !bookingData) throw new Error("Could not fetch booking details");
                
                // Directly finalize since time is single selection now
                await finalizeAcceptTask(taskId, bookingData.preferred_time || 'TBD', bookingData);
            } else {
                const { error } = await supabase
                    .from('contact_queries')
                    .update({ is_accepted: true })
                    .eq('id', taskId);
                if (error) throw error;
                setTasks(tasks.map(t => t.id === taskId ? { ...t, is_accepted: true } : t));
            }
        } catch (err: any) {
            console.error('Error accepting task:', err);
            showAlert("Error: " + err.message);
        } finally {
            setProcessingTaskId(null);
        }
    };

    const handleDeclineTask = async (taskId: string, type: 'query' | 'booking') => {
        if (!await showConfirm("Confirm Decline", "Are you sure you want to decline this assignment?")) return;
        try {
            if (type === 'booking') {
                const { error } = await supabase
                    .from('bookings')
                    .update({ status: 'pending', assigned_mentor_id: null })
                    .eq('id', taskId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('contact_queries')
                    .update({ assigned_mentor_id: null })
                    .eq('id', taskId);
                if (error) throw error;
            }
            setTasks(tasks.filter(t => t.id !== taskId));
            showSuccess("Task declined and returned to pool.");
        } catch (err) {
            console.error('Error declining task:', err);
        }
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('mentors')
                .update({
                    name: editForm.name,
                    subject: editForm.subject,
                    description: editForm.description,
                    linkedin_url: editForm.linkedin_url,
                    qualification: editForm.qualification,
                    work_history: editForm.work_history,
                    location_address: editForm.location_address,
                    latitude: editForm.latitude,
                    longitude: editForm.longitude
                })
                .eq('id', profile.id);

            if (error) throw error;
            setProfile({ ...profile, ...editForm });
            setIsEditModalOpen(false);
            showSuccess("Profile updated successfully!");
        } catch (err: any) {
            console.error("Update error:", err);
            showAlert("Failed to update profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showAlert("Passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            showAlert("Password must be at least 6 characters");
            return;
        }

        setPasswordLoading(true);
        try {
            // Re-authenticate to verify current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: passwordForm.currentPassword
            });

            if (signInError) {
                showAlert("Current password is incorrect");
                return;
            }

            // Update with new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (updateError) throw updateError;

            showSuccess("Password changed successfully!");
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            console.error("Password change error:", err);
            showAlert("Failed to change password: " + err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const markNotificationAsRead = async (id: string) => {
        const { error } = await supabase
            .from('mentor_notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map((n: Notification) => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllNotificationsAsRead = async () => {
        if (!profile?.id) return;
        const { error } = await supabase
            .from('mentor_notifications')
            .update({ is_read: true })
            .eq('mentor_id', profile.id);

        if (!error) {
            setNotifications(prev => prev.map((n: Notification) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from('mentor_notifications')
            .delete()
            .eq('id', id);

        if (!error) {
            const deletedNotif = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter((n: Notification) => n.id !== id));
            if (deletedNotif && !deletedNotif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleAddAvailability = async () => {
        if (!profile) return;
        try {
            // Helper to convert time string (HH:mm:ss) to minutes from midnight for comparison
            const toMinutes = (time: string) => {
                const [h, m] = time.split(':').map(Number);
                return h * 60 + m;
            };

            // Convert to 24h format for DB
            const convertTo24h = (h: string, m: string, ampm: string) => {
                let hour = parseInt(h);
                if (ampm === 'PM' && hour < 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                return `${hour.toString().padStart(2, '0')}:${m}:00`;
            };

            const startTime = convertTo24h(newSlot.start_hour, newSlot.start_min, newSlot.start_ampm);
            const endTime = convertTo24h(newSlot.end_hour, newSlot.end_min, newSlot.end_ampm);

            const startMins = toMinutes(startTime);
            const endMins = toMinutes(endTime);

            // Validation: End must be after Start
            if (endMins <= startMins) {
                showAlert("The end time must be later than the start time.");
                return;
            }

            // CHECK FOR DUPLICATES OR OVERLAPS
            const hasConflict = availability.find(existing => {
                if (existing.day_of_week !== newSlot.day_of_week) return false;
                
                const existingStart = toMinutes(existing.start_time);
                const existingEnd = toMinutes(existing.end_time);
                
                // Exact Duplicate
                if (existingStart === startMins && existingEnd === endMins) return true;
                
                // Overlap check: (NewStart < ExistingEnd) AND (NewEnd > ExistingStart)
                return (startMins < existingEnd) && (endMins > existingStart);
            });

            if (hasConflict) {
                showAlert(`This conflict with an existing slot on ${newSlot.day_of_week} (${hasConflict.start_time.substring(0,5)} - ${hasConflict.end_time.substring(0,5)}). Please choose a different time.`);
                return;
            }

            const { data, error } = await supabase
                .from('mentor_availability')
                .insert([{ 
                    day_of_week: newSlot.day_of_week,
                    start_time: startTime,
                    end_time: endTime,
                    mentor_id: profile.id 
                }])
                .select();
            
            if (error) {
                console.error('Error adding availability:', error);
                showAlert(`Failed to add availability: ${error.message}`);
                return;
            }
            
            if (data && data.length > 0) {
                setAvailability([...availability, data[0]]);
                showSuccess("Availability window added!");
            }
        } catch (err) {
            console.error('Error adding availability:', err);
        }
    };

    const handleDeleteAvailability = async (id: string) => {
        try {
            const { error } = await supabase
                .from('mentor_availability')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setAvailability(availability.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting availability:', err);
        }
    };

    const formatTime12h = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${m} ${ampm}`;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-['Urbanist'] pt-16 md:pt-24">
            {loading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                    <BrandedLoading />
                </div>
            )}

            {/* Home-style Header */}
            <header className="fixed w-full top-0 z-50 bg-white shadow-md border-b border-gray-100">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link href="/" className="flex items-center space-x-0">
                        <img src="/newlogo.png" alt="Hour Home Logo" className="w-40 h-40 object-contain -my-15 ml-1 mr-1 scale-110" />
                        <div className="ml-2 hidden sm:block">
                            <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Mentor<span className="text-[#a0522d]">Portal</span></h1>
                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Faculty System</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`w-10 h-10 rounded-full bg-[#1B2A5A] flex items-center justify-center text-white transition-all shadow-sm ${isNotificationOpen ? 'ring-2 ring-[#a0522d]/50' : ''}`}
                                aria-label="Notifications"
                            >
                                <FaBell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            <AnimatePresence>
                                {isNotificationOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-white rounded-[24px] shadow-2xl border border-gray-100 p-0 z-[110] origin-top-right overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-[#1B2A5A]/5">
                                            <h3 className="text-sm font-black text-[#1B2A5A]">RECENT ALERTS</h3>
                                            <span className="text-[9px] font-black bg-[#1B2A5A] text-white px-2 py-0.5 rounded-full">
                                                {unreadCount} NEW
                                            </span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto px-1 py-1 custom-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => (
                                                    <div 
                                                        key={n.id} 
                                                        onClick={() => markNotificationAsRead(n.id)}
                                                        className={`p-3 rounded-xl mb-1 cursor-pointer transition-all ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 border-l-2 border-blue-500 hover:bg-blue-50/50'}`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-[11px] font-black text-gray-900 leading-tight">{n.title}</p>
                                                            <span className="text-[8px] text-gray-400 font-bold uppercase">{new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 flex flex-col items-center">
                                                    <FaBell className="text-gray-200 mb-2" size={20} />
                                                    <p className="text-[11px] font-bold text-gray-400">No new alerts</p>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => { setActiveTab('notifications'); setIsNotificationOpen(false); }}
                                            className="w-full py-3 text-center text-[10px] font-black text-[#1B2A5A] bg-gray-50 hover:bg-gray-100 transition-colors uppercase tracking-widest border-t border-gray-100"
                                        >
                                            View All Alerts
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center text-[#1B2A5A] hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <FaBars size={24} />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative hidden lg:block" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="h-10 flex items-center gap-3 bg-[#1B2A5A] text-white px-2 pr-4 rounded-full hover:bg-[#142044] transition-all border border-white/10 shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-white/50 flex-shrink-0">
                                    <img src={profile?.image_url} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col items-start pr-2">
                                    <span className="text-xs font-bold text-white line-clamp-1">{profile?.name.split(' ')[0]}</span>
                                    <span className="text-[10px] text-[#22c55e] font-bold leading-none mt-0.5 uppercase tracking-tighter">Mentor</span>
                                </div>
                                <FaChevronDown size={10} className={`text-white/80 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[100] origin-top-right"
                                    >
                                        <div className="px-5 py-3 border-b border-gray-50 mb-2">
                                            <p className="text-sm font-bold text-[#1B2A5A] mb-1">Signed in as</p>
                                            <p className="text-sm font-black text-gray-800 truncate">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-gray-600 hover:text-[#a0522d] hover:bg-orange-50 transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center"><FaUser size={14} /></div>
                                            Profile Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-black text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all border-t border-gray-50 mt-2"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><FaSignOutAlt size={14} /></div>
                                            Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Sidebar Navigation Drawer */}
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="fixed inset-0 bg-[#1B2A5A]/40 backdrop-blur-sm z-[100] lg:hidden"
                                />
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed right-0 top-0 h-full w-[280px] bg-white shadow-2xl z-[101] lg:hidden flex flex-col"
                                >
                                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="text-sm font-black text-[#1B2A5A] uppercase tracking-widest">Dashboard Menu</h3>
                                        <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                            <FaTimes size={18} />
                                        </button>
                                    </div>

                                    {/* Mobile Profile Summary */}
                                    <div className="p-6 bg-gray-50/50">
                                        <div className="flex items-center gap-4 mb-4">
                                            <img src={profile?.image_url} alt={profile?.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900 leading-tight">{profile?.name}</h4>
                                                <p className="text-[10px] font-bold text-[#a0522d] uppercase tracking-tighter mt-0.5">{profile?.subject}</p>
                                                <div className="flex bg-yellow-400 text-white px-2 py-0.5 rounded-full items-center gap-1 mt-1.5 w-fit">
                                                    <FaStar size={8} />
                                                    <span className="text-[10px] font-black">{profile?.rating || '0.0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {[
                                            { id: 'profile', icon: <FaUser />, label: 'My Profile' },
                                            { id: 'availability', icon: <FaCalendarCheck />, label: 'Availability' },
                                            { id: 'assignments', icon: <FaCalendarAlt />, label: 'Assignments' },
                                            { id: 'offers', icon: <FaMapMarkerAlt />, label: 'Nearby Offers' },
                                            { id: 'tasks', icon: <FaClock />, label: 'Current Tasks' },
                                            { id: 'notifications', icon: <FaBell />, label: 'Notifications' },
                                            { id: 'history', icon: <FaHistory />, label: 'Booking History' },
                                            { id: 'incentives', icon: <FaStar />, label: 'Incentives' },
                                            { id: 'security', icon: <FaSignOutAlt />, label: 'Password' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                                    ? 'bg-[#1B2A5A] text-white shadow-lg'
                                                    : 'bg-white text-gray-400 hover:text-gray-900 hover:shadow-sm'
                                                }`}
                                            >
                                                <span className="text-sm">{tab.icon}</span>
                                                {tab.label}
                                            </button>
                                        ))}
                                    </nav>

                                    <div className="p-4 border-t border-gray-50">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <FaSignOutAlt size={16} />
                                            Sign Out Account
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Tabs - Hidden on Mobile, drawer used instead */}
                    <div className="hidden lg:block lg:col-span-3 space-y-2">
                        {[
                            { id: 'profile', icon: <FaUser />, label: 'My Profile' },
                            { id: 'availability', icon: <FaCalendarCheck />, label: 'Availability' },
                            { id: 'assignments', icon: <FaCalendarAlt />, label: 'Assignments' },
                            { id: 'offers', icon: <FaMapMarkerAlt />, label: 'Nearby Offers' },
                            { id: 'tasks', icon: <FaClock />, label: 'Current Tasks' },
                            { id: 'notifications', icon: <FaBell />, label: 'Notifications' },
                            { id: 'history', icon: <FaHistory />, label: 'Booking History' },
                            { id: 'incentives', icon: <FaStar />, label: 'Incentives' },
                            { id: 'calendar', icon: <FaCalendarAlt />, label: 'Calendar' },
                            { id: 'security', icon: <FaSignOutAlt />, label: 'Password Settings' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-[#1B2A5A] text-white shadow-xl shadow-[#1B2A5A]/20'
                                    : 'bg-white text-gray-400 hover:text-gray-900 hover:shadow-md'
                                    }`}
                            >
                                <span className="text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="absolute top-6 right-6 w-10 h-10 bg-gray-50 text-gray-400 hover:text-[#a0522d] hover:bg-orange-50 rounded-xl flex items-center justify-center transition-all shadow-sm border border-gray-100"
                                            title="Edit Profile"
                                        >
                                            <FaPen size={14} />
                                        </button>

                                        <div className="relative group">
                                            <img src={profile?.image_url} alt={profile?.name} className="w-40 h-40 rounded-3xl object-cover border-4 border-white shadow-2xl" />
                                        </div>
                                        <div className="flex-1 space-y-4 pt-4 md:pt-0">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.name}</h2>
                                                    <div className="flex bg-yellow-400 text-white px-3 py-1 rounded-full items-center gap-1.5 shadow-sm shadow-yellow-400/20">
                                                        <FaStar size={10} />
                                                        <span className="text-xs font-black">{profile?.rating || '0.0'}</span>
                                                    </div>
                                                </div>
                                                <p className="text-lg font-bold text-[#a0522d]">{profile?.subject} Specialist</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FaUser size={12} /></div>
                                                    <span className="text-xs font-bold">{profile?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center"><FaLinkedin size={12} /></div>
                                                    <a href={profile?.linkedin_url} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline">LinkedIn Profile</a>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><FaGraduationCap size={12} /></div>
                                                    <span className="text-xs font-bold">{profile?.qualification}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><FaBriefcase size={12} /></div>
                                                    <span className="text-xs font-bold">Work History verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                            <h3 className="text-sm font-bold text-[#1B2A5A] mb-4">Professional Bio</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                                                {profile?.description}
                                            </p>
                                        </div>
                                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                            <h3 className="text-sm font-bold text-[#1B2A5A] mb-4">Work Experience</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
                                                {profile?.work_history}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'availability' && (
                                <motion.div
                                    key="availability"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50"
                                >
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Time Management</h2>
                                            <p className="text-sm font-bold text-[#1B2A5A] mt-1">Set your daily active windows</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-6 mb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                                            {/* Day Selection */}
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-sm font-bold text-[#1B2A5A] ml-1">Day of Week</label>
                                                <select
                                                    value={newSlot.day_of_week}
                                                    onChange={e => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none"
                                                >
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => <option key={day} value={day}>{day}</option>)}
                                                </select>
                                            </div>

                                            {/* Start Time */}
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-sm font-bold text-[#1B2A5A] ml-1">Start Time</label>
                                                <div className="flex gap-1">
                                                    <select 
                                                        value={newSlot.start_hour}
                                                        onChange={e => setNewSlot({...newSlot, start_hour: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.start_min}
                                                        onChange={e => setNewSlot({...newSlot, start_min: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.start_ampm}
                                                        onChange={e => setNewSlot({...newSlot, start_ampm: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-[#1B2A5A] text-white border-none rounded-xl outline-none text-[10px] font-black focus:ring-2 focus:ring-[#a0522d] appearance-none text-center cursor-pointer"
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex items-center justify-center pb-4 text-gray-300">
                                                <div className="w-4 h-0.5 bg-gray-200 rounded-full"></div>
                                            </div>

                                            {/* End Time */}
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-sm font-bold text-[#1B2A5A] ml-1">End Time</label>
                                                <div className="flex gap-1">
                                                    <select 
                                                        value={newSlot.end_hour}
                                                        onChange={e => setNewSlot({...newSlot, end_hour: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.end_min}
                                                        onChange={e => setNewSlot({...newSlot, end_min: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-[#a0522d] appearance-none text-center"
                                                    >
                                                        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <select 
                                                        value={newSlot.end_ampm}
                                                        onChange={e => setNewSlot({...newSlot, end_ampm: e.target.value})}
                                                        className="flex-1 px-2 py-3 bg-[#1B2A5A] text-white border-none rounded-xl outline-none text-[10px] font-black focus:ring-2 focus:ring-[#a0522d] appearance-none text-center cursor-pointer"
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAddAvailability}
                                            className="w-full bg-[#1B2A5A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#142044] transition-all flex items-center justify-center gap-3 py-4 shadow-xl shadow-[#1B2A5A]/10"
                                        >
                                            <FaPlus size={10} /> Add Time Window
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availability.map(slot => (
                                            <div key={slot.id} className="p-5 bg-white border-2 border-gray-50 rounded-3xl hover:border-[#a0522d]/20 transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a0522d] bg-orange-50 px-3 py-1 rounded-full">{slot.day_of_week}</span>
                                                    <button onClick={() => handleDeleteAvailability(slot.id)} className="text-gray-300 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-900">
                                                    <FaClock size={12} className="text-gray-400" />
                                                    <span className="text-sm font-black tracking-tight">{formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'assignments' && (
                                <motion.div
                                    key="assignments"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Direct Assignments</h2>
                                                <p className="text-sm font-bold text-[#1B2A5A] mt-1">Special requests assigned to you by the Admin</p>
                                            </div>
                                        </div>

                                        {assignmentOffers.length === 0 ? (
                                            <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                                <FaCalendarCheck size={32} className="text-gray-200 mx-auto mb-4" />
                                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2">No active assignments</h4>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest max-w-xs mx-auto leading-loose">
                                                    You don't have any pending assignment requests at the moment.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-6">
                                                {assignmentOffers.map(offer => (
                                                    <div key={offer.id} className="bg-white p-6 rounded-[32px] border-2 border-orange-50 hover:border-orange-200 transition-all flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="px-3 py-1 bg-orange-50 text-[#a0522d] rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                                                                    Priority Assignment
                                                                </span>
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                                    ID: {offer.booking_id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xl font-black text-gray-900 tracking-tight mb-1">
                                                                    {offer.booking?.curriculum} • Class {offer.booking?.class_id}
                                                                </h4>
                                                                {offer.booking?.selected_units && (
                                                                    <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
                                                                        {offer.booking.selected_units.map((unit: any, idx: number) => (
                                                                            <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                                                                {(unit.unit_no !== undefined && unit.unit_no !== null) ? `Unit ${unit.unit_no}: ` : ''}{unit.topic_name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <p className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
                                                                    <FaMapMarkerAlt size={10} className="text-[#a0522d]" />
                                                                    {offer.booking?.primary_student?.address || 'Address provided upon acceptance'}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-4">
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                                    <FaCalendarAlt size={12} className="text-[#a0522d]" />
                                                                    <span className="text-[11px] font-black text-gray-700">{offer.booking?.preferred_date || 'TBD'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                                    <FaClock size={12} className="text-[#a0522d]" />
                                                                    <span className="text-[11px] font-black text-gray-700">{offer.booking?.preferred_time || 'TBD'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-xl border border-green-100">
                                                                    <span className="text-[11px] font-black text-green-600">Payout: ₹{offer.offered_payout}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                                            <button
                                                                onClick={() => handleAcceptAssignmentOffer(offer)}
                                                                disabled={processingTaskId === offer.id}
                                                                className="flex-1 md:flex-none px-8 py-4 bg-[#1B2A5A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a0522d] transition-all shadow-xl shadow-[#1B2A5A]/10 flex items-center justify-center gap-2"
                                                            >
                                                                {processingTaskId === offer.id ? (
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : (
                                                                    <>Accept Request</>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectAssignmentOffer(offer.id)}
                                                                className="p-4 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                                title="Decline Request"
                                                            >
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'offers' && (
                                <motion.div
                                    key="offers"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden min-h-[400px] flex items-center justify-center text-center">
                                        <div className="relative z-10 space-y-6 max-w-md">
                                            <div className="w-24 h-24 bg-orange-50 text-[#a0522d] rounded-[32px] flex items-center justify-center mx-auto shadow-inner border border-orange-100">
                                                <FaWifi size={40} className="animate-pulse" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Nearby Offers</h2>
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                                    Coming Soon in Phase 2
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
                                                    We are building a passive offer system that will notify you of students in your neighborhood looking for mentors. Stay tuned!
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab('assignments')}
                                                className="px-8 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a0522d] transition-all shadow-xl shadow-black/10"
                                            >
                                                Check Direct Assignments
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'tasks' && (
                                <motion.div
                                    key="tasks"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Assignments</h2>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full border border-blue-100">{tasks.filter(t => t.status === 'awaiting_approval' || !t.is_accepted).length} New Requests</span>
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100">
                                            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaClock size={24} />
                                            </div>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active tasks assigned.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {tasks.slice(0, visibleTasksCount).map(task => (
                                                <div key={task.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-black text-gray-900">{task.name}</h3>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${task.type === 'booking' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                    {task.type === 'booking' ? 'Session Booking' : 'General Query'}
                                                                </span>
                                                                {task.is_rescheduled && (
                                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 italic">
                                                                        Rescheduled
                                                                    </span>
                                                                )}
                                                            </div>
                                                        {task.query ? (
                                                            <p className="text-xs text-gray-500 font-medium italic mb-4">"{task.query}"</p>
                                                        ) : (
                                                            <div className="mb-4">
                                                                <p className="text-xs text-[#a0522d] font-black uppercase tracking-widest mb-1.5">
                                                                    {task.curriculum} • Class {task.class_id}
                                                                </p>
                                                                {task.selected_units && (
                                                                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
                                                                        {task.selected_units.map((unit: any, idx: number) => (
                                                                            <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                                                {(unit.unit_no !== undefined && unit.unit_no !== null) ? `Unit ${unit.unit_no}: ` : ''}{unit.topic_name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-4">
                                                            <span className="text-[10px] font-bold text-gray-400">Email: {task.email}</span>
                                                            <span className="text-[10px] font-bold text-gray-400">Phone: {task.phone}</span>
                                                            {task.type === 'booking' && (
                                                                <>
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                        <FaCalendarAlt size={10} className="text-[#a0522d]" />
                                                                        <span className="text-[10px] font-bold text-gray-600">{task.preferred_date || 'TBD'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                        <FaClock size={10} className="text-[#a0522d]" />
                                                                        <span className="text-[10px] font-bold text-gray-600">{task.preferred_time || 'TBD'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                        {task.session_mode === 'online' ? <FaWifi size={10} className="text-[#a0522d]" /> : <FaHome size={10} className="text-[#a0522d]" />}
                                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">{task.session_mode || 'offline'}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {(task.type === 'query' && !task.is_accepted) || (task.type === 'booking' && task.status === 'awaiting_approval') ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptTask(task.id, task.type)}
                                                                    disabled={processingTaskId === task.id}
                                                                    className="px-6 py-3 bg-[#1B2A5A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#142044] transition-all shadow-lg shadow-[#1B2A5A]/10 flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {processingTaskId === task.id ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                            Processing...
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            <FaCheckCircle size={12} /> Accept Task
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeclineTask(task.id, task.type)}
                                                                    className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                                                                    title="Decline / Pass Task"
                                                                >
                                                                    <FaTrash size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-end gap-3">
                                                                <div className="flex items-center gap-2 text-green-500 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                                                                    <FaCheckCircle size={12} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">{task.status === 'completed' ? 'Session Completed' : 'Active & Confirmed'}</span>
                                                                </div>
                                                                
                                                                {task.type === 'booking' && task.status === 'confirmed' && (
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Enter Session OTP"
                                                                            maxLength={6}
                                                                            className="w-32 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#a0522d] transition-all"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    handleValidateOTP(task.id, (e.target as HTMLInputElement).value);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                                handleValidateOTP(task.id, input.value);
                                                                            }}
                                                                            className="px-4 py-2 bg-[#a0522d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#804224] transition-all"
                                                                        >
                                                                            Validate
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {tasks.length > visibleTasksCount && (
                                                <div className="flex justify-center pt-8">
                                                    <button
                                                        onClick={() => setVisibleTasksCount(prev => prev + 5)}
                                                        className="group flex items-center gap-2 text-[#a0522d] hover:text-[#c75e33] font-black text-[10px] uppercase tracking-widest transition-all"
                                                    >
                                                        <FaChevronDown className="group-hover:translate-y-1 transition-transform" />
                                                        Show More Tasks
                                                        <span className="text-gray-400 font-bold ml-1">
                                                            ({tasks.length - visibleTasksCount})
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Notification Center</h2>
                                            <p className="text-gray-400 font-bold text-sm mt-1 border-l-4 border-[#a0522d] pl-4">Stay updated with class schedules and system alerts.</p>
                                        </div>
                                        
                                        {notifications.some(n => !n.is_read) && (
                                            <button 
                                                onClick={markAllNotificationsAsRead}
                                                className="flex items-center gap-3 px-8 py-4 bg-white text-[#1B2A5A] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200/50 border border-gray-100 hover:bg-gray-50 transition-all"
                                            >
                                                <FaCheckCircle className="text-green-500" />
                                                Mark All As Read
                                            </button>
                                        )}
                                    </div>

                                    {notifications.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {notifications.map((n) => (
                                                <div 
                                                    key={n.id}
                                                    className={`group relative p-6 md:p-8 rounded-[40px] transition-all bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 ${!n.is_read ? 'border-l-[6px] border-l-blue-500' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${!n.is_read ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'}`}>
                                                                    <FaBell size={16} />
                                                                </div>
                                                                <h3 className="text-lg font-black text-[#1B2A5A] tracking-tight">{n.title}</h3>
                                                            </div>
                                                            <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-3xl ml-14">
                                                                {n.message}
                                                            </p>
                                                            <div className="mt-4 flex items-center gap-6 ml-14">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    <FaClock size={12} />
                                                                    {new Date(n.created_at).toLocaleDateString(undefined, { 
                                                                        month: 'long', 
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                                {!n.is_read && (
                                                                    <button 
                                                                        onClick={() => markNotificationAsRead(n.id)}
                                                                        className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-[0.2em] transition-colors"
                                                                    >
                                                                        Mark read
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={() => deleteNotification(n.id)}
                                                            className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                                            title="Delete notification"
                                                        >
                                                            <FaTrash size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[60px] border border-dashed border-gray-200">
                                            <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-200 mb-8 border border-gray-100">
                                                <FaBell size={40} />
                                            </div>
                                            <h2 className="text-2xl font-black text-[#1B2A5A] mb-2 tracking-tight">Zero Notifications</h2>
                                            <p className="text-gray-400 font-bold max-w-xs text-center leading-relaxed text-sm">
                                                We'll notify you here when sessions are rescheduled or assignments are updated.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Session History</h2>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-4 py-1.5 rounded-full border border-green-100">
                                            {tasks.filter(t => t.status === 'completed').length} Completed
                                        </span>
                                    </div>

                                    {tasks.filter(t => t.status === 'completed').length === 0 ? (
                                        <div className="bg-white p-20 rounded-[40px] shadow-sm border border-gray-100 text-center">
                                            <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <FaHistory size={32} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Booking Lifecycle</h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest max-w-xs mx-auto leading-loose">
                                                Your completed sessions and student feedback history will appear here once sessions are finalized.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {tasks.filter(t => t.status === 'completed').map(task => (
                                                <div key={task.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-black text-gray-900">{task.name}</h3>
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-green-50 text-green-600">
                                                                Completed
                                                            </span>
                                                        </div>
                                                        <div className="mb-4">
                                                            <p className="text-xs text-[#a0522d] font-black uppercase tracking-widest mb-1.5">
                                                                {task.curriculum} • Class {task.class_id}
                                                            </p>
                                                            {task.selected_units && (
                                                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
                                                                    {task.selected_units.map((unit: any, idx: number) => (
                                                                        <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                                            {(unit.unit_no !== undefined && unit.unit_no !== null) ? `Unit ${unit.unit_no}: ` : ''}{unit.topic_name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-4">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                <FaCalendarAlt size={10} className="text-[#a0522d]" />
                                                                <span className="text-[10px] font-bold text-gray-600">{task.preferred_date}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                <FaClock size={10} className="text-[#a0522d]" />
                                                                <span className="text-[10px] font-bold text-gray-600">{task.preferred_time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 text-right">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance Status</span>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg border border-green-100">
                                                            <FaCheckCircle size={12} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">OTP Verified</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'calendar' && (
                                <motion.div
                                    key="calendar"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="max-w-4xl mx-auto space-y-6"
                                >
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Calendar</h2>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Confirmed Sessions Schedule</p>
                                            </div>
                                            <div className="flex bg-gray-50 rounded-2xl p-1 gap-2">
                                                <button onClick={prevMonth} className="w-10 h-10 flex flex-col items-center justify-center text-gray-400 hover:text-[#a0522d] hover:bg-white rounded-xl transition-all shadow-sm">
                                                    <FaChevronLeft size={12} />
                                                </button>
                                                <div className="px-6 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                                                    <span className="text-sm font-black text-[#1B2A5A] uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</span>
                                                </div>
                                                <button onClick={nextMonth} className="w-10 h-10 flex flex-col items-center justify-center text-gray-400 hover:text-[#a0522d] hover:bg-white rounded-xl transition-all shadow-sm">
                                                    <FaChevronRight size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 mb-4">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 pb-4">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-2">
                                            {eachDayOfInterval({
                                                start: startOfWeek(startOfMonth(currentMonth)),
                                                end: endOfWeek(endOfMonth(currentMonth))
                                            }).map((day, idx) => {
                                                const daySessions = tasks.filter(t => 
                                                    t.type === 'booking' && 
                                                    t.status === 'confirmed' && 
                                                    t.preferred_date === format(day, 'yyyy-MM-dd')
                                                );
                                                
                                                const isSelected = isSameDay(day, selectedDate);
                                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                                const isToday = isSameDay(day, new Date());

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedDate(day)}
                                                        className={`min-h-[80px] p-2 rounded-2xl border transition-all flex flex-col items-center justify-start gap-1 relative ${
                                                            !isCurrentMonth ? 'opacity-30 bg-gray-50 border-transparent' : 
                                                            isSelected ? 'border-[#a0522d] bg-orange-50/50 shadow-sm' : 
                                                            isToday ? 'border-[#1B2A5A]/30 bg-[#1B2A5A]/5' : 
                                                            'border-gray-100 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <span className={`text-xs font-black ${
                                                            isSelected ? 'text-[#a0522d]' : 
                                                            isToday ? 'text-[#1B2A5A]' : 
                                                            'text-gray-600'
                                                        }`}>
                                                            {format(day, 'd')}
                                                        </span>
                                                        <div className="flex flex-wrap gap-1 justify-center max-w-full px-1">
                                                            {daySessions.map((_, i) => (
                                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#a0522d]" />
                                                            ))}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Selected Day Details */}
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-3">
                                            <FaCalendarCheck className="text-[#a0522d]" /> 
                                            Sessions for {format(selectedDate, 'do MMMM yyyy')}
                                        </h3>
                                        
                                        {tasks.filter(t => t.type === 'booking' && t.status === 'confirmed' && t.preferred_date === format(selectedDate, 'yyyy-MM-dd')).length === 0 ? (
                                            <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold text-xs">
                                                No sessions scheduled for this date.
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {tasks.filter(t => t.type === 'booking' && t.status === 'confirmed' && t.preferred_date === format(selectedDate, 'yyyy-MM-dd')).map(session => (
                                                    <div key={session.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-black text-gray-900">{session.name}</span>
                                                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{session.curriculum}</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-gray-500">{session.phone}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5 text-[#a0522d] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100/50">
                                                                <FaClock size={12} />
                                                                <span className="text-[11px] font-black uppercase tracking-widest">{session.preferred_time}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-xl">
                                                                {session.session_mode === 'online' ? <FaWifi size={12} /> : <FaHome size={12} />}
                                                                <span className="text-[11px] font-black uppercase tracking-widest">{session.session_mode || 'Offline'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'incentives' && (
                                <motion.div
                                    key="incentives"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="max-w-4xl mx-auto space-y-4"
                                >
                                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <FaStar size={100} />
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <div className="mb-8">
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Incentives</h2>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Earn rewards upon 10 successful offline sessions</p>
                                            </div>

                                            {/* Tiered Progress Path */}
                                            <div className="relative px-4 pb-12 pt-12">
                                                {/* Connecting Line (Background) */}
                                                <div className="absolute top-[108px] left-12 right-12 h-1 bg-gray-100 rounded-full" />
                                                
                                                {/* Progress Line (Active) */}
                                                <div className="absolute top-[108px] left-12 right-12 h-1 overflow-hidden pointer-events-none">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((offlineSessionCount / 10) * 100, 100)}%` }}
                                                        className="h-full bg-[#1B2A5A]"
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center relative z-20">
                                                    {[
                                                        { count: 3, label: '3 Gigs' },
                                                        { count: 4, label: '4 Gigs' },
                                                        { count: 5, label: '5 Gigs' },
                                                        { count: 7, label: '7 Gigs' },
                                                        { count: 8, label: '8 Gigs' },
                                                        { count: 10, reward: '₹1000', label: '10 Gigs', locked: true }
                                                    ].map((m, idx) => {
                                                        const isAchieved = offlineSessionCount >= m.count;
                                                        return (
                                                            <div key={idx} className="flex flex-col items-center gap-6">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tight h-5">
                                                                    {m.reward || ''}
                                                                </div>
                                                                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-500 bg-white ${
                                                                    isAchieved ? 'border-[#1B2A5A] scale-110 shadow-lg' : 'border-gray-100'
                                                                }`}>
                                                                    {m.locked && !isAchieved ? (
                                                                        <FaLock size={10} className="text-gray-300" />
                                                                    ) : (
                                                                        <div className={`w-2 h-2 rounded-full ${isAchieved ? 'bg-[#1B2A5A]' : 'bg-gray-100'}`} />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`text-[10px] font-black transition-colors ${isAchieved ? 'text-gray-900' : 'text-gray-300'}`}>
                                                                        {m.count}
                                                                    </div>
                                                                    <div className="text-[8px] font-black uppercase text-gray-300 tracking-widest">
                                                                        Gigs
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 max-w-lg mx-auto flex flex-col items-center gap-4">
                                                <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight text-center">
                                                    Complete <span className="text-[#1B2A5A] font-black">10 successful offline sessions</span> to unlock the premium <span className="text-[#a0522d] font-black">₹1000 Incentive</span>. Keep up the great work!
                                                </p>
                                                
                                                {offlineSessionCount >= 10 && (
                                                    <motion.button
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={handleRaiseInvoice}
                                                        disabled={isSaving}
                                                        className="px-8 py-3 bg-[#1B2A5A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#1B2A5A]/20 hover:bg-[#142044] transition-all disabled:opacity-50"
                                                    >
                                                        {isSaving ? 'Processing...' : 'Raise Invoice (₹1000)'}
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="max-w-xl mx-auto"
                                >
                                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 bg-orange-50 text-[#a0522d] rounded-2xl flex items-center justify-center">
                                                <FaSignOutAlt />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Password Settings</h2>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Update your portal access credentials</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleChangePassword} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#1B2A5A] ml-1">Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPass ? "text" : "password"}
                                                        required
                                                        value={passwordForm.currentPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm pr-12"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showCurrentPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="h-[1px] bg-gray-50" />

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#1B2A5A] ml-1">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPass ? "text" : "password"}
                                                        required
                                                        value={passwordForm.newPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm pr-12"
                                                        placeholder="Min. 6 characters"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPass(!showNewPass)}
                                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showNewPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-[#1B2A5A] ml-1">Confirm New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPass ? "text" : "password"}
                                                        required
                                                        value={passwordForm.confirmPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm pr-12"
                                                        placeholder="Re-type new password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showConfirmPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={passwordLoading}
                                                className="w-full py-5 bg-[#1B2A5A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20 disabled:opacity-50 mt-4"
                                            >
                                                {passwordLoading ? (
                                                    <span className="flex items-center justify-center gap-3">
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Updating Security...
                                                    </span>
                                                ) : (
                                                    "Update Password"
                                                )}
                                            </button>
                                        </form>

                                        <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                                            <div className="flex gap-4">
                                                <FaInfoCircle className="text-blue-500 mt-0.5" size={16} />
                                                <p className="text-[10px] text-blue-600 font-bold leading-relaxed uppercase tracking-tight">
                                                    After updating your password, your current session will remain active on this device. Future logins will require the new credentials.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-none">Edit Profile</h2>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 px-1 border-l-2 border-[#a0522d]">Faculty Records</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-all">
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1">Subject Expertise</label>
                                        <input
                                            type="text"
                                            value={editForm.subject}
                                            onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1">LinkedIn Profile</label>
                                        <input
                                            type="text"
                                            value={editForm.linkedin_url}
                                            onChange={e => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-[#1B2A5A] ml-1">Qualification</label>
                                        <input
                                            type="text"
                                            value={editForm.qualification}
                                            onChange={e => setEditForm({ ...editForm, qualification: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-[#1B2A5A] ml-1">Professional Bio</label>
                                    <textarea
                                        rows={4}
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-[#1B2A5A] ml-1">Work Experience</label>
                                    <textarea
                                        rows={4}
                                        value={editForm.work_history}
                                        onChange={e => setEditForm({ ...editForm, work_history: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm resize-none"
                                    />
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a0522d] flex items-center gap-3">
                                        <span className="w-8 h-[1px] bg-[#a0522d]/30"></span> Service Location
                                    </h3>
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Base Address / Primary Area</label>
                                            <input
                                                type="text"
                                                value={editForm.location_address}
                                                onChange={e => setEditForm({ ...editForm, location_address: e.target.value })}
                                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all text-sm"
                                                placeholder="e.g. Jubilee Hills, Hyderabad"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!navigator.geolocation) {
                                                    showAlert("Geolocation is not supported");
                                                    return;
                                                }
                                                setEditForm(prev => ({ ...prev, location_address: 'Detecting...' }));
                                                navigator.geolocation.getCurrentPosition(async (pos) => {
                                                    const { latitude, longitude } = pos.coords;
                                                    try {
                                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                        const data = await res.json();
                                                        setEditForm(prev => ({
                                                            ...prev,
                                                            latitude,
                                                            longitude,
                                                            location_address: data.display_name || `${latitude}, ${longitude}`
                                                        }));
                                                    } catch (e) {
                                                        setEditForm(prev => ({ ...prev, latitude, longitude, location_address: `${latitude}, ${longitude}` }));
                                                    }
                                                }, () => {
                                                    showAlert("Location access denied");
                                                    setEditForm(prev => ({ ...prev, location_address: profile?.location_address || '' }));
                                                });
                                            }}
                                            className="px-6 py-4 bg-orange-50 text-[#a0522d] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center gap-2 mb-0.5"
                                        >
                                            <FaMapMarkerAlt size={12} /> Pin Location
                                        </button>
                                    </div>
                                    {(editForm.latitude && editForm.longitude) && (
                                        <p className="text-[9px] font-bold text-green-500 ml-1 flex items-center gap-1">
                                            <FaCheckCircle size={8} /> Coordinates Saved: {editForm.latitude.toFixed(4)}, {editForm.longitude.toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-[#1B2A5A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#142044] transition-all shadow-xl shadow-[#1B2A5A]/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FaSave /> Commit Changes</>}
                                </button>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-8 py-4 border-2 border-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Discard
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default MentorDashboard;
