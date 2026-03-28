import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaDownload, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    created_at: string;
}

const AdminLeads: React.FC = () => {
    const { supabaseClient: supabase } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, phone, address, created_at')
            .eq('role', 'parent_student')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }
        setLoading(false);
    };

    const filterLeads = (leads: Lead[]) => {
        const now = new Date();
        let filtered = leads;

        if (filterType === 'daily') {
            filtered = leads.filter(l => new Date(l.created_at).toDateString() === now.toDateString());
        } else if (filterType === 'weekly') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = leads.filter(l => new Date(l.created_at) >= lastWeek);
        } else if (filterType === 'monthly') {
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = leads.filter(l => new Date(l.created_at) >= lastMonth);
        } else if (filterType === 'custom' && startDate && endDate) {
            filtered = leads.filter(l => {
                const date = new Date(l.created_at);
                return date >= new Date(startDate) && date <= new Date(endDate);
            });
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(l => 
                l.name.toLowerCase().includes(term) || 
                l.email.toLowerCase().includes(term) || 
                l.phone.includes(term) ||
                (l.address && l.address.toLowerCase().includes(term))
            );
        }

        return filtered;
    };

    const exportToExcel = () => {
        const filteredLeads = filterLeads(leads);
        const worksheetData = filteredLeads.map(l => ({
            'Date': new Date(l.created_at).toLocaleDateString(),
            'Name': l.name,
            'Email': l.email,
            'Contact Number': l.phone,
            'Address': l.address || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);
        
        // Add headers separately to make them bold
        const heading = [["Hour Home Website Leads"], [`Sub heading Date: ${new Date().toLocaleDateString()}`], []];
        XLSX.utils.sheet_add_aoa(ws, heading, { origin: "A1" });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        XLSX.writeFile(wb, `Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 font-['Urbanist']">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Leads</h1>
                    <p className="text-sm font-bold text-[#1B2A5A] mt-1 uppercase tracking-widest text-[10px]">Manage and export student/parent registration data</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="bg-[#1B2A5A] text-white px-6 py-3 rounded-xl font-black hover:bg-[#142044] transition-all flex items-center gap-3 shadow-xl shadow-blue-900/10 text-[11px] uppercase tracking-widest"
                >
                    <FaDownload size={14} />
                    Export to Excel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        {(['all', 'daily', 'weekly', 'monthly', 'custom'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-[#1B2A5A] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex-grow relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1B2A5A]/10 transition-all"
                        />
                    </div>
                </div>

                {filterType === 'custom' && (
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location / Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full mb-4"></div>
                                            <div className="h-4 w-48 bg-gray-100 rounded mb-2"></div>
                                            <div className="h-3 w-32 bg-gray-50 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filterLeads(leads).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-gray-400">No leads found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : (
                                filterLeads(leads).map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="text-[#a0522d]/40" size={12} />
                                                <span className="text-xs font-bold text-gray-600">
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#a0522d]/10 flex items-center justify-center text-[#a0522d] font-black text-xs">
                                                    {lead.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{lead.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{lead.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-[#1B2A5A]/5 text-[#1B2A5A] uppercase tracking-widest border border-[#1B2A5A]/10">
                                                {lead.phone}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-xs font-medium text-gray-500 max-w-xs line-clamp-2 leading-relaxed">
                                                {lead.address || <span className="text-gray-200 italic">No address provided</span>}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminLeads;
