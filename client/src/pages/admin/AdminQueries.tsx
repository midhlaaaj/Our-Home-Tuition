import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaTrash, FaEnvelope, FaPhone, FaCalendarAlt, FaSearch, FaCheckCircle, FaDownload } from 'react-icons/fa';

interface Mentor {
    id: string;
    name: string;
    subject: string;
}

interface ContactQuery {
    id: string;
    name: string;
    email: string;
    phone: string;
    query: string;
    is_resolved: boolean;
    created_at: string;
    assigned_mentor_id?: string;
}

const AdminQueries: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [queries, setQueries] = useState<ContactQuery[]>([]);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
    const [assigningId, setAssigningId] = useState<string | null>(null);

    useEffect(() => {
        fetchQueries();
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        const { data } = await supabase.from('mentors').select('id, name, subject').eq('is_active', true);
        setMentors(data || []);
    };

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contact_queries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQueries(data || []);
        } catch (err: any) {
            console.error('Error fetching queries:', err);
            alert(`Fetch error: ${err.message || 'Check your database permissions'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignMentor = async (queryId: string, mentorId: string) => {
        try {
            const { error } = await supabase
                .from('contact_queries')
                .update({ assigned_mentor_id: mentorId })
                .eq('id', queryId);

            if (error) throw error;
            setQueries(queries.map(q => q.id === queryId ? { ...q, assigned_mentor_id: mentorId } : q));
            setAssigningId(null);
        } catch (err: any) {
            console.error('Error assigning mentor:', err);
            alert(`Failed to assign: ${err.message}`);
        }
    };

    const handleToggleResolve = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('contact_queries')
                .update({ is_resolved: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setQueries(queries.map(q => q.id === id ? { ...q, is_resolved: !currentStatus } : q));
        } catch (err: any) {
            console.error('Error updating status:', err);
            alert(`Failed to update status: ${err.message || 'Check your database permissions'}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this query?')) return;

        try {
            const { error } = await supabase
                .from('contact_queries')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setQueries(queries.filter(q => q.id !== id));
        } catch (err: any) {
            console.error('Error deleting query:', err);
            alert(`Failed to delete query: ${err.message || 'Check your database permissions'}`);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Name', 'Email', 'Phone', 'Query', 'Status'];
        const rows = queries.map(q => [
            new Date(q.created_at).toLocaleDateString(),
            q.name,
            q.email,
            q.phone,
            q.query.replace(/"/g, '""'),
            q.is_resolved ? 'Resolved' : 'Unresolved'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Contact_Queries_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.query.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'all' ? true :
            filter === 'resolved' ? q.is_resolved : !q.is_resolved;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inbox Hub</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Manage <span className="text-[#a0522d]">Still Doubtful</span> inquiries.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {(['unresolved', 'resolved', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-[#1B2A5A] text-white shadow-lg shadow-[#1B2A5A]/10'
                                    : 'text-gray-400 hover:text-[#1B2A5A] hover:bg-gray-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-[#a0522d] transition-all shadow-sm"
                    >
                        <FaDownload size={10} /> Export
                    </button>

                    <div className="relative group w-full md:w-60">
                        <FaSearch size={10} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#a0522d] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#a0522d]/10 focus:border-[#a0522d] outline-none transition-all font-medium text-xs"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-50 animate-pulse h-40 shadow-sm"></div>
                    ))}
                </div>
            ) : filteredQueries.length === 0 ? (
                <div className="bg-white rounded-[32px] p-16 text-center border border-gray-50 shadow-2xl">
                    <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaEnvelope size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">Queue Empty</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">All signals are clear.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredQueries.map((query) => (
                        <div key={query.id} className={`bg-white rounded-[24px] p-4 border ${query.is_resolved ? 'border-green-50 bg-green-50/5' : 'border-gray-50'} shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col h-full relative overflow-hidden active:scale-[0.98]`}>
                            {query.is_resolved && (
                                <div className="absolute top-0 right-0 p-2.5 bg-green-500 text-white rounded-bl-xl shadow-lg">
                                    <FaCheckCircle size={8} />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                                <div className="space-y-0.5 max-w-[70%]">
                                    <h3 className={`text-sm font-black transition-colors line-clamp-1 ${query.is_resolved ? 'text-gray-300 line-through' : 'text-gray-900'}`}>{query.name}</h3>
                                    <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                        <FaCalendarAlt size={7} />
                                        {new Date(query.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleToggleResolve(query.id, query.is_resolved)}
                                        className={`p-1.5 rounded-lg shadow-sm border transition-all ${query.is_resolved ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white border-gray-50 text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
                                    >
                                        <FaCheckCircle size={10} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(query.id)}
                                        className="p-1.5 bg-white border border-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg shadow-sm transition-all"
                                    >
                                        <FaTrash size={10} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5 flex-grow">
                                <div className="space-y-1">
                                    <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${query.is_resolved ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${query.is_resolved ? 'bg-gray-50 text-gray-200' : 'bg-orange-50 text-[#a0522d]'}`}>
                                            <FaEnvelope size={8} />
                                        </div>
                                        <span className="truncate">{query.email}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${query.is_resolved ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${query.is_resolved ? 'bg-gray-50 text-gray-200' : 'bg-blue-50 text-blue-600'}`}>
                                            <FaPhone size={8} />
                                        </div>
                                        <span>{query.phone}</span>
                                    </div>
                                </div>

                                <div className={`pt-3 border-t mt-auto ${query.is_resolved ? 'border-green-50' : 'border-gray-50'}`}>
                                    <p className="text-[11px] leading-relaxed italic line-clamp-3 text-gray-500 font-medium mb-3">
                                        "{query.query}"
                                    </p>

                                    {!query.is_resolved && (
                                        <div className="flex flex-col gap-2">
                                            {assigningId === query.id ? (
                                                <select
                                                    className="w-full text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 p-2 rounded-lg outline-none focus:border-[#a0522d]"
                                                    onChange={(e) => handleAssignMentor(query.id, e.target.value)}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Select Mentor</option>
                                                    {mentors.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name} ({m.subject})</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={() => setAssigningId(query.id)}
                                                    className="w-full py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#a0522d] hover:border-[#a0522d]/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {query.assigned_mentor_id ? (
                                                        <>Reassign: {mentors.find(m => m.id === query.assigned_mentor_id)?.name || 'Mentor'}</>
                                                    ) : (
                                                        <>Assign Mentor</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminQueries;
