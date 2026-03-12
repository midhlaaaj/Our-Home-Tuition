import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaTrash, FaCheckCircle, FaInbox } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const NotificationsPage: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
    };

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (!error) {
            setNotifications(notifications.filter(n => n.id !== id));
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            
            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-[#1B2A5A] mb-1 tracking-tight">Notifications</h1>
                            <p className="text-gray-400 font-medium text-sm">Stay updated with your latest alerts.</p>
                        </div>
                        
                        {notifications.some(n => !n.is_read) && (
                            <button 
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-[#1B2A5A] rounded-2xl font-bold text-sm shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
                            >
                                <FaCheckCircle className="text-blue-500" />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="space-y-4">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id}
                                    className={`group relative p-4 md:p-5 rounded-3xl transition-all bg-white border border-gray-100 shadow-sm hover:shadow-md ${!n.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-base font-bold text-[#1B2A5A]">{n.title}</h3>
                                                {!n.is_read && (
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{n.message}</p>
                                            <div className="mt-3 flex items-center gap-4">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    {new Date(n.created_at).toLocaleDateString(undefined, { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {!n.is_read && (
                                                    <button 
                                                        onClick={() => markAsRead(n.id)}
                                                        className="text-xs font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => deleteNotification(n.id)}
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete notification"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-8">
                                <FaInbox size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-[#1B2A5A] mb-3">No notifications yet</h2>
                            <p className="text-gray-400 max-w-xs text-center leading-relaxed">
                                When you receive updates about your bookings, they will appear here.
                            </p>
                            <Link 
                                to="/" 
                                className="mt-10 px-8 py-4 bg-[#1B2A5A] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/10 hover:-translate-y-1 transition-all"
                            >
                                Back to Home
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NotificationsPage;
