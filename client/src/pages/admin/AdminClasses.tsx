import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { classesData } from '../../constants/classesData';
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight, FaBook, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

interface Subject {
    id: string;
    class_id: number;
    name: string;
    curriculum: 'CBSE' | 'STATE';
    full_subject_price: number;
    estimated_duration: number; // in minutes
    created_at: string;
}

interface Topic {
    id: string;
    subject_id: string;
    name: string;
    description: string | null;
    unit_no: number;
    unit_title: string | null;
    unit_price: number;
    estimated_duration: number; // in minutes
    created_at: string;
}

const AdminClasses: React.FC = () => {
    const [selectedClassId, setSelectedClassId] = useState<number>(1);
    const [selectedCurriculum, setSelectedCurriculum] = useState<'CBSE' | 'STATE'>('CBSE');
    const [selectedStateRegion, setSelectedStateRegion] = useState<'ANDHRA' | 'TELANGANA'>('ANDHRA');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Record<string, Topic[]>>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectPrice, setNewSubjectPrice] = useState<number>(0);
    const [newSubjectDuration, setNewSubjectDuration] = useState<number>(0);
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicDesc, setNewTopicDesc] = useState('');
    const [newUnitPrice, setNewUnitPrice] = useState<number>(100);
    const [newTopicDuration, setNewTopicDuration] = useState<number>(60);
    const [newUnitNo, setNewUnitNo] = useState<number>(1);
    const [newUnitTitle, setNewUnitTitle] = useState('');
    const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Edit states
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [editSubjectName, setEditSubjectName] = useState('');
    const [editSubjectPrice, setEditSubjectPrice] = useState<number>(0);
    const [editSubjectDuration, setEditSubjectDuration] = useState<number>(0);
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editTopicName, setEditTopicName] = useState('');
    const [editTopicDesc, setEditTopicDesc] = useState('');
    const [editTopicUnitPrice, setEditTopicUnitPrice] = useState<number>(100);
    const [editTopicDuration, setEditTopicDuration] = useState<number>(60);
    const [editTopicUnitNo, setEditTopicUnitNo] = useState<number>(1);
    const [editTopicUnitTitle, setEditTopicUnitTitle] = useState('');

    // Unit Edit states
    const [editingUnitKey, setEditingUnitKey] = useState<{ subjectId: string, unitNo: number } | null>(null);
    const [editUnitNo, setEditUnitNo] = useState<number>(1);
    const [editUnitTitle, setEditUnitTitle] = useState('');

    // Fetch subjects for selected class and curriculum
    const fetchSubjects = async () => {
        setLoading(true);
        try {
                let query = supabase
                    .from('class_subjects')
                    .select('*')
                    .eq('class_id', selectedClassId)
                    .eq('curriculum', selectedCurriculum);

                if (selectedCurriculum === 'STATE') {
                    query = query.eq('state_region', selectedStateRegion);
                }

                const { data, error } = await query
                    .order('created_at', { ascending: true });

            if (error) throw error;
            setSubjects(data || []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch topics for a specific subject
    const fetchTopics = async (subjectId: string) => {
        try {
            const { data, error } = await supabase
                .from('class_topics')
                .select('*')
                .eq('subject_id', subjectId)
                .order('unit_no', { ascending: true })
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTopics(prev => ({ ...prev, [subjectId]: data || [] }));
        } catch (err) {
            console.error('Error fetching topics:', err);
        }
    };

    useEffect(() => {
        fetchSubjects();
        setExpandedSubject(null);
        setAddingTopicFor(null);
        setTopics({});
    }, [selectedClassId, selectedCurriculum, selectedStateRegion]);

    // Add a new subject
    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        try {
            const { error } = await supabase
                .from('class_subjects')
                .insert([{
                    class_id: selectedClassId,
                    name: newSubjectName.trim(),
                    curriculum: selectedCurriculum,
                    state_region: selectedCurriculum === 'STATE' ? selectedStateRegion : 'ANDHRA',
                    full_subject_price: newSubjectPrice,
                    estimated_duration: newSubjectDuration
                }]);

            if (error) throw error;
            setNewSubjectName('');
            setNewSubjectPrice(0);
            fetchSubjects();
        } catch (err) {
            console.error('Error adding subject:', err);
            alert('Failed to add subject.');
        }
    };

    // Delete a subject
    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Delete this subject and all its topics?')) return;
        try {
            const { error } = await supabase
                .from('class_subjects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSubjects();
        } catch (err) {
            console.error('Error deleting subject:', err);
            alert('Failed to delete subject.');
        }
    };

    // Toggle expand subject to see topics
    const toggleSubject = (subjectId: string) => {
        if (expandedSubject === subjectId) {
            setExpandedSubject(null);
            setAddingTopicFor(null);
        } else {
            setExpandedSubject(subjectId);
            setAddingTopicFor(null);
            fetchTopics(subjectId);
        }
    };

    // Add a new topic under a subject
    const handleAddTopic = async (subjectId: string) => {
        if (!newTopicName.trim()) return;
        try {
            const { error } = await supabase
                .from('class_topics')
                .insert([{
                    subject_id: subjectId,
                    name: newTopicName.trim(),
                    description: newTopicDesc.trim() || null,
                    unit_no: newUnitNo,
                    unit_title: newUnitTitle.trim() || null,
                    unit_price: newUnitPrice,
                    estimated_duration: newTopicDuration
                }]);

            if (error) throw error;
            setNewTopicName('');
            setNewTopicDesc('');
            setNewUnitPrice(100);
            // Keep unit settings for easy consecutive adding if preferred, 
            // or reset them. Let's keep them but maybe increment unit_no if user wants?
            // For now, let's just reset name/desc.
            setAddingTopicFor(null);
            fetchTopics(subjectId);
        } catch (err) {
            console.error('Error adding topic:', err);
            alert('Failed to add topic.');
        }
    };

    // Delete a topic
    const handleDeleteTopic = async (topicId: string, subjectId: string) => {
        if (!confirm('Delete this topic?')) return;
        try {
            const { error } = await supabase
                .from('class_topics')
                .delete()
                .eq('id', topicId);

            if (error) throw error;
            fetchTopics(subjectId);
        } catch (err) {
            console.error('Error deleting topic:', err);
            alert('Failed to delete topic.');
        }
    };

    // Edit subject handlers
    const handleEditSubject = (subject: Subject) => {
        setEditingSubjectId(subject.id);
        setEditSubjectName(subject.name);
        setEditSubjectPrice(subject.full_subject_price || 0);
        setEditSubjectDuration(subject.estimated_duration || 0);
    };

    const handleSaveSubject = async (subjectId: string) => {
        if (!editSubjectName.trim()) return;
        try {
            const { error } = await supabase
                .from('class_subjects')
                .update({ 
                    name: editSubjectName.trim(),
                    full_subject_price: editSubjectPrice,
                    estimated_duration: editSubjectDuration
                })
                .eq('id', subjectId);

            if (error) throw error;
            setEditingSubjectId(null);
            fetchSubjects();
        } catch (err) {
            console.error('Error updating subject:', err);
            alert('Failed to update subject.');
        }
    };

    const handleCancelEditSubject = () => {
        setEditingSubjectId(null);
    };

    // Edit topic handlers
    const handleEditTopic = (topic: Topic) => {
        setEditingTopicId(topic.id);
        setEditTopicName(topic.name);
        setEditTopicDesc(topic.description || '');
        setEditTopicUnitNo(topic.unit_no);
        setEditTopicUnitTitle(topic.unit_title || '');
        setEditTopicUnitPrice(topic.unit_price || 100);
        setEditTopicDuration(topic.estimated_duration || 60);
    };

    const handleSaveTopic = async (topicId: string, subjectId: string) => {
        if (!editTopicName.trim()) return;
        try {
            const { error } = await supabase
                .from('class_topics')
                .update({
                    name: editTopicName.trim(),
                    description: editTopicDesc.trim() || null,
                    unit_no: editTopicUnitNo,
                    unit_title: editTopicUnitTitle.trim() || null,
                    unit_price: editTopicUnitPrice,
                    estimated_duration: editTopicDuration
                })
                .eq('id', topicId);

            if (error) throw error;
            setEditingTopicId(null);
            fetchTopics(subjectId);
        } catch (err) {
            console.error('Error updating topic:', err);
            alert('Failed to update topic.');
        }
    };

    const handleCancelEditTopic = () => {
        setEditingTopicId(null);
    };

    // Unit edit handlers
    const handleEditUnit = (unitNo: number, unitTitle: string | null, subjectId: string) => {
        setEditingUnitKey({ subjectId, unitNo });
        setEditUnitNo(unitNo);
        setEditUnitTitle(unitTitle || '');
    };

    const handleSaveUnit = async () => {
        if (!editingUnitKey) return;
        try {
            const { error } = await supabase
                .from('class_topics')
                .update({
                    unit_no: editUnitNo,
                    unit_title: editUnitTitle.trim() || null
                })
                .eq('subject_id', editingUnitKey.subjectId)
                .eq('unit_no', editingUnitKey.unitNo);

            if (error) throw error;
            setEditingUnitKey(null);
            fetchTopics(editingUnitKey.subjectId);
        } catch (err) {
            console.error('Error updating unit:', err);
            alert('Failed to update unit.');
        }
    };

    const handleCancelEditUnit = () => {
        setEditingUnitKey(null);
    };

    const handleAutoCalculate = (subjectId: string, isEditing: boolean) => {
        const subjectTopics = topics[subjectId] || [];
        if (subjectTopics.length === 0) return;

        // Group by unit to sum up unit prices (distinct units)
        const units = groupTopicsByUnit(subjectTopics);
        const totalPrice = units.reduce((acc, u) => acc + (u.topics[0]?.unit_price || 0), 0);
        const totalDuration = units.reduce((acc, u) => acc + (u.topics[0]?.estimated_duration || 0), 0);

        if (isEditing) {
            setEditSubjectPrice(totalPrice);
            setEditSubjectDuration(totalDuration);
        } else {
            setNewSubjectPrice(totalPrice);
            setNewSubjectDuration(totalDuration);
        }
    };

    // Helper to group topics by unit_no
    const groupTopicsByUnit = (subjectTopics: Topic[]) => {
        const groups: Record<number, { unit_no: number, unit_title: string | null, topics: Topic[] }> = {};
        subjectTopics.forEach(topic => {
            if (!groups[topic.unit_no]) {
                groups[topic.unit_no] = {
                    unit_no: topic.unit_no,
                    unit_title: topic.unit_title,
                    topics: []
                };
            }
            groups[topic.unit_no].topics.push(topic);
        });
        return Object.values(groups).sort((a, b) => a.unit_no - b.unit_no);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Curriculum Manager</h1>
                <p className="text-sm text-gray-500 font-medium">Configure subjects and topics per class level.</p>
            </div>

            {/* Selectors Row */}
            <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-50 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class Level</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(Number(e.target.value))}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all cursor-pointer appearance-none text-gray-800 font-black text-sm"
                        >
                            {classesData.map((cls) => (
                                <option key={cls.id} value={cls.id}>{cls.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Curriculum</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedCurriculum('CBSE')}
                                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all shadow-sm ${selectedCurriculum === 'CBSE'
                                    ? 'bg-[#a0522d] text-white'
                                    : 'bg-white border-2 border-gray-100 text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                CBSE
                            </button>
                            <button
                                onClick={() => setSelectedCurriculum('STATE')}
                                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all shadow-sm ${selectedCurriculum === 'STATE'
                                    ? 'bg-[#a0522d] text-white'
                                    : 'bg-white border-2 border-gray-100 text-gray-400 hover:bg-gray-50'
                                    }`}
                            >
                                STATE
                            </button>
                        </div>
                    </div>
                    {selectedCurriculum === 'STATE' && (
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State Region</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedStateRegion('ANDHRA')}
                                    className={`flex-1 py-3 rounded-xl font-black text-xs transition-all shadow-sm ${selectedStateRegion === 'ANDHRA'
                                        ? 'bg-[#1B2A5A] text-white'
                                        : 'bg-white border-2 border-gray-100 text-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    ANDHRA
                                </button>
                                <button
                                    onClick={() => setSelectedStateRegion('TELANGANA')}
                                    className={`flex-1 py-3 rounded-xl font-black text-xs transition-all shadow-sm ${selectedStateRegion === 'TELANGANA'
                                        ? 'bg-[#1B2A5A] text-white'
                                        : 'bg-white border-2 border-gray-100 text-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    TELANGANA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Subject */}
            <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-50 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#a0522d] flex items-center justify-center">
                        <FaPlus size={12} />
                    </div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                        New Subject - Class {selectedClassId}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="e.g. Mathematics"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        className="flex-1 bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-medium text-sm"
                    />
                    <div className="w-32 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                        <input
                            type="number"
                            placeholder="Price"
                            value={newSubjectPrice}
                            onChange={(e) => setNewSubjectPrice(Number(e.target.value))}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none pl-6 pr-3 py-3 rounded-xl transition-all font-medium text-sm"
                        />
                    </div>
                    <div className="w-24 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Min</span>
                        <input
                            type="number"
                            placeholder="Duration"
                            value={newSubjectDuration}
                            onChange={(e) => setNewSubjectDuration(Number(e.target.value))}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none pl-10 pr-3 py-3 rounded-xl transition-all font-medium text-sm"
                        />
                    </div>
                    <button
                        onClick={handleAddSubject}
                        disabled={!newSubjectName.trim()}
                        className="bg-[#1B2A5A] text-white px-6 py-3 rounded-xl font-black hover:bg-[#142044] disabled:opacity-50 transition shadow-lg shadow-[#1B2A5A]/10 text-xs"
                    >
                        Create
                    </button>
                </div>
            </div>

            {/* Subjects List */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <FaBook size={14} className="text-[#a0522d]" /> {selectedCurriculum} Library
                    </h2>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        {subjects.length} Subjects
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center animate-pulse">
                        <div className="inline-block w-6 h-6 border-3 border-[#a0522d]/20 border-t-[#a0522d] rounded-full animate-spin"></div>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FaBook size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium">No subjects recorded yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {subjects.map((subject) => (
                            <div key={subject.id}>
                                {/* Subject Header */}
                                <div
                                    className="flex items-center justify-between p-3 hover:bg-gray-50/50 cursor-pointer transition-colors group"
                                    onClick={() => { if (editingSubjectId !== subject.id) toggleSubject(subject.id); }}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        {expandedSubject === subject.id ? (
                                            <FaChevronDown className="text-[#a0522d] text-[10px]" />
                                        ) : (
                                            <FaChevronRight className="text-gray-300 text-[10px]" />
                                        )}
                                        {editingSubjectId === subject.id ? (
                                            <div className="flex items-center gap-2 flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editSubjectName}
                                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                                    className="flex-1 bg-white border-2 border-[#a0522d] outline-none px-3 py-1.5 rounded-lg text-sm font-black"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSubject(subject.id)}
                                                />
                                                <div className="w-24 relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={editSubjectPrice}
                                                        onChange={(e) => setEditSubjectPrice(Number(e.target.value))}
                                                        className="w-full bg-white border-2 border-[#a0522d] outline-none pl-5 pr-2 py-1.5 rounded-lg text-sm font-black"
                                                    />
                                                </div>
                                                <div className="w-24 relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">Min</span>
                                                    <input
                                                        type="number"
                                                        value={editSubjectDuration}
                                                        onChange={(e) => setEditSubjectDuration(Number(e.target.value))}
                                                        className="w-full bg-white border-2 border-[#a0522d] outline-none pl-8 pr-2 py-1.5 rounded-lg text-sm font-black"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleAutoCalculate(subject.id, true); }}
                                                    className="bg-orange-50 text-orange-600 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-orange-100"
                                                >
                                                    Auto
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-gray-800 text-sm group-hover:text-[#a0522d] transition-colors">{subject.name}</span>
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {subject.curriculum}
                                                    </span>
                                                    {topics[subject.id] && (
                                                        <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {topics[subject.id].length} topics
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        ₹{subject.full_subject_price || 0}
                                                    </span>
                                                    <span className="text-[9px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {subject.estimated_duration || 0} Min
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                        {editingSubjectId === subject.id ? (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSaveSubject(subject.id); }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                                                >
                                                    <FaCheck size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCancelEditSubject(); }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                                                >
                                                    <FaTimes size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditSubject(subject); }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Topics (Expanded) */}
                                {expandedSubject === subject.id && (
                                    <div className="bg-gray-50/50 px-8 pb-4 pt-2 border-t border-gray-50">
                                        {(topics[subject.id] || []).length === 0 ? (
                                            <p className="text-[10px] font-black text-gray-300 tracking-widest py-3 italic">Empty syllabus</p>
                                        ) : (
                                            <div className="space-y-6 mb-6">
                                                {groupTopicsByUnit(topics[subject.id] || []).map((group) => (
                                                    <div key={group.unit_no} className="space-y-3">
                                                        {/* Unit Header */}
                                                        <div className="flex items-center justify-between group/unit w-full">
                                                            {editingUnitKey?.subjectId === subject.id && editingUnitKey?.unitNo === group.unit_no ? (
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <input
                                                                        type="number"
                                                                        value={editUnitNo}
                                                                        onChange={(e) => setEditUnitNo(parseInt(e.target.value))}
                                                                        className="w-16 bg-white border-2 border-[#a0522d] outline-none px-2 py-1 rounded-lg text-xs font-black"
                                                                        placeholder="No"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={editUnitTitle}
                                                                        onChange={(e) => setEditUnitTitle(e.target.value)}
                                                                        className="flex-1 bg-white border-2 border-[#a0522d] outline-none px-3 py-1 rounded-lg text-xs font-black"
                                                                        placeholder="Unit Title (optional)"
                                                                    />
                                                                    <button onClick={handleSaveUnit} className="text-green-500 hover:bg-green-50 p-1 rounded-lg"><FaCheck size={10} /></button>
                                                                    <button onClick={handleCancelEditUnit} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg"><FaTimes size={10} /></button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <h3 className="text-xs font-black text-[#a0522d] tracking-wider">
                                                                        Unit {group.unit_no}{group.unit_title ? `: ${group.unit_title}` : ''}
                                                                    </h3>
                                                                    <button
                                                                        onClick={() => handleAutoCalculate(subject.id, editingSubjectId === subject.id)}
                                                                        className="text-orange-500 hover:text-orange-700 transition-all p-1 text-[10px] font-black underline decoration-orange-300"
                                                                        title="Auto-calculate subject price/time from units"
                                                                    >
                                                                        SUM
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditUnit(group.unit_no, group.unit_title, subject.id)}
                                                                        className="text-gray-300 hover:text-blue-500 transition-all p-1"
                                                                    >
                                                                        <FaEdit size={12} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Topics list for this unit */}
                                                        <ul className="space-y-2 pl-4">
                                                            {group.topics.map((topic) => (
                                                                <li key={topic.id} className="group/topic flex items-start justify-between bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                                                    <div className="flex items-start gap-3 flex-1">
                                                                        <span className="text-[#e69b48] font-bold mt-1">•</span>
                                                                        {editingTopicId === topic.id ? (
                                                                            <div className="flex-1 mr-4 space-y-2">
                                                                                <input
                                                                                    type="text"
                                                                                    value={editTopicName}
                                                                                    onChange={(e) => setEditTopicName(e.target.value)}
                                                                                    className="w-full bg-white border-2 border-[#a0522d] outline-none px-3 py-1 rounded-lg text-sm font-black"
                                                                                    placeholder="Topic Name"
                                                                                    autoFocus
                                                                                />
                                                                                <textarea
                                                                                    value={editTopicDesc}
                                                                                    onChange={(e) => setEditTopicDesc(e.target.value)}
                                                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none px-3 py-2 rounded-lg text-xs font-medium resize-none shadow-inner"
                                                                                    placeholder="Description (optional)"
                                                                                    rows={2}
                                                                                />
                                                                          <div className="flex gap-2 items-center">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase">Unit Price:</label>
                                                        <div className="relative w-20">
                                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                                                            <input
                                                                type="number"
                                                                value={editTopicUnitPrice}
                                                                onChange={(e) => setEditTopicUnitPrice(Number(e.target.value))}
                                                                className="w-full bg-gray-50 border border-gray-200 rounded pl-4 pr-1.5 py-0.5 text-xs font-bold"
                                                            />
                                                        </div>
                                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Move to Unit:</label>
                                                        <input
                                                            type="number"
                                                            value={editTopicUnitNo}
                                                            onChange={(e) => setEditTopicUnitNo(parseInt(e.target.value))}
                                                            className="w-12 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-bold"
                                                        />
                                                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Min:</label>
                                                        <input
                                                            type="number"
                                                            value={editTopicDuration}
                                                            onChange={(e) => setEditTopicDuration(Number(e.target.value))}
                                                            className="w-16 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-bold"
                                                        />
                                                    </div>
                                                                            </div>
                                                                        ) : (
                                                                      <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-gray-800 text-[13px] leading-tight mb-0.5">{topic.name}</p>
                                                        <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">₹{topic.unit_price || 100}</span>
                                                        <span className="text-[9px] font-black text-green-500 bg-green-50 px-1.5 py-0.5 rounded">{topic.estimated_duration || 60}m</span>
                                                    </div>
                                                    {topic.description && (
                                                        <p className="text-[11px] text-gray-400 font-medium line-clamp-2">{topic.description}</p>
                                                    )}
                                                </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                                                        {editingTopicId === topic.id ? (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleSaveTopic(topic.id, subject.id)}
                                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-50"
                                                                                >
                                                                                    <FaCheck size={10} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleCancelEditTopic}
                                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                                                                                >
                                                                                    <FaTimes size={10} />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => handleEditTopic(topic)}
                                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                                                >
                                                                                    <FaEdit size={10} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteTopic(topic.id, subject.id)}
                                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                                >
                                                                                    <FaTrash size={10} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Topic Form */}
                                        {addingTopicFor === subject.id ? (
                                            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="col-span-1">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block ml-1">Unit No</label>
                                                        <input
                                                            type="number"
                                                            value={newUnitNo}
                                                            onChange={(e) => setNewUnitNo(parseInt(e.target.value))}
                                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-black text-sm"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block ml-1">Unit Title</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Basics..."
                                                            value={newUnitTitle}
                                                            onChange={(e) => setNewUnitTitle(e.target.value)}
                                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-black text-sm"
                                                        />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block ml-1">Duration (Min)</label>
                                                        <input
                                                            type="number"
                                                            value={newTopicDuration}
                                                            onChange={(e) => setNewTopicDuration(Number(e.target.value))}
                                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-black text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Topic Title (e.g. The Alphabet)"
                                                    value={newTopicName}
                                                    onChange={(e) => setNewTopicName(e.target.value)}
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-black text-sm"
                                                />
                                                <textarea
                                                    placeholder="Topic description (optional)..."
                                                    value={newTopicDesc}
                                                    onChange={(e) => setNewTopicDesc(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-[#a0522d] focus:bg-white outline-none p-3 rounded-xl transition-all font-medium text-xs resize-none"
                                                />
                                                <div className="flex gap-2 pt-1 border-t border-gray-50">
                                                    <button
                                                        onClick={() => handleAddTopic(subject.id)}
                                                        disabled={!newTopicName.trim()}
                                                        className="flex-1 bg-[#1B2A5A] text-white py-2.5 rounded-xl font-black text-xs hover:bg-[#142044] disabled:opacity-50 transition"
                                                    >
                                                        Create Topic
                                                    </button>
                                                    <button
                                                        onClick={() => { setAddingTopicFor(null); setNewTopicName(''); setNewTopicDesc(''); }}
                                                        className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl font-black text-xs hover:bg-gray-200 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingTopicFor(subject.id)}
                                                className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-[#a0522d] hover:text-[#a0522d] hover:bg-[#a0522d]/5 transition-all flex items-center justify-center gap-2 mt-2"
                                            >
                                                <FaPlus size={8} /> Add New Topic
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminClasses;
