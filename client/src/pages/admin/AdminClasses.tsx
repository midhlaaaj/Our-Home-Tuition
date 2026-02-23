import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { classesData } from '../../constants/classesData';
import { FaPlus, FaTrash, FaChevronDown, FaChevronRight, FaBook } from 'react-icons/fa';

interface Subject {
    id: string;
    class_id: number;
    name: string;
    curriculum: 'CBSE' | 'STATE';
    created_at: string;
}

interface Topic {
    id: string;
    subject_id: string;
    name: string;
    description: string | null;
    created_at: string;
}

const AdminClasses: React.FC = () => {
    const [selectedClassId, setSelectedClassId] = useState<number>(1);
    const [selectedCurriculum, setSelectedCurriculum] = useState<'CBSE' | 'STATE'>('CBSE');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Record<string, Topic[]>>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicDesc, setNewTopicDesc] = useState('');
    const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch subjects for selected class and curriculum
    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('class_subjects')
                .select('*')
                .eq('class_id', selectedClassId)
                .eq('curriculum', selectedCurriculum)
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
    }, [selectedClassId, selectedCurriculum]);

    // Add a new subject
    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        try {
            const { error } = await supabase
                .from('class_subjects')
                .insert([{
                    class_id: selectedClassId,
                    name: newSubjectName.trim(),
                    curriculum: selectedCurriculum
                }]);

            if (error) throw error;
            setNewSubjectName('');
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
                    description: newTopicDesc.trim() || null
                }]);

            if (error) throw error;
            setNewTopicName('');
            setNewTopicDesc('');
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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Classes</h1>
                <p className="text-gray-500 mt-2">Add subjects and topics for each class and curriculum.</p>
            </div>

            {/* Selectors Row */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(Number(e.target.value))}
                            className="w-full border border-gray-200 focus:border-[#a0522d] focus:ring-1 focus:ring-[#a0522d] outline-none p-3 rounded-lg transition-all cursor-pointer appearance-none bg-white shadow-sm text-gray-800 font-medium"
                        >
                            {classesData.map((cls) => (
                                <option key={cls.id} value={cls.id}>{cls.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Curriculum</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedCurriculum('CBSE')}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${selectedCurriculum === 'CBSE'
                                        ? 'bg-[#a0522d] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                CBSE
                            </button>
                            <button
                                onClick={() => setSelectedCurriculum('STATE')}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${selectedCurriculum === 'STATE'
                                        ? 'bg-[#a0522d] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                STATE
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Subject */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Add Subject to Class {selectedClassId} ({selectedCurriculum})
                </h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="e.g., Mathematics"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        className="flex-1 border border-gray-200 focus:border-[#a0522d] focus:ring-1 focus:ring-[#a0522d] outline-none p-3 rounded-lg transition-all"
                    />
                    <button
                        onClick={handleAddSubject}
                        disabled={!newSubjectName.trim()}
                        className="bg-[#a0522d] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#804224] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-sm"
                    >
                        <FaPlus /> Add
                    </button>
                </div>
            </div>

            {/* Subjects List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {selectedCurriculum} Subjects for Class {selectedClassId}
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-[#a0522d] rounded-full animate-spin"></div>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <FaBook size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No {selectedCurriculum} subjects added yet for this class.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {subjects.map((subject) => (
                            <div key={subject.id}>
                                {/* Subject Header */}
                                <div
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggleSubject(subject.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedSubject === subject.id ? (
                                            <FaChevronDown className="text-[#a0522d] text-sm" />
                                        ) : (
                                            <FaChevronRight className="text-gray-400 text-sm" />
                                        )}
                                        <span className="font-semibold text-gray-800">{subject.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${subject.curriculum === 'CBSE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {subject.curriculum}
                                        </span>
                                        {topics[subject.id] && (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                {topics[subject.id].length} topics
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                                        className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete Subject"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>

                                {/* Topics (Expanded) */}
                                {expandedSubject === subject.id && (
                                    <div className="bg-gray-50 px-6 pb-4 pt-2 border-t border-gray-100">
                                        {/* Existing Topics */}
                                        {(topics[subject.id] || []).length === 0 ? (
                                            <p className="text-gray-400 text-sm py-2">No topics yet.</p>
                                        ) : (
                                            <ul className="space-y-2 mb-4">
                                                {(topics[subject.id] || []).map((topic) => (
                                                    <li key={topic.id} className="flex items-start justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-800 text-sm">{topic.name}</p>
                                                            {topic.description && (
                                                                <p className="text-xs text-gray-500 mt-1">{topic.description}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteTopic(topic.id, subject.id)}
                                                            className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
                                                            title="Delete Topic"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Add Topic Form */}
                                        {addingTopicFor === subject.id ? (
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Topic Name (e.g., Algebra)"
                                                    value={newTopicName}
                                                    onChange={(e) => setNewTopicName(e.target.value)}
                                                    className="w-full border border-gray-200 focus:border-[#a0522d] focus:ring-1 focus:ring-[#a0522d] outline-none p-2.5 rounded-lg text-sm transition-all"
                                                />
                                                <textarea
                                                    placeholder="Description (optional)"
                                                    value={newTopicDesc}
                                                    onChange={(e) => setNewTopicDesc(e.target.value)}
                                                    rows={2}
                                                    className="w-full border border-gray-200 focus:border-[#a0522d] focus:ring-1 focus:ring-[#a0522d] outline-none p-2.5 rounded-lg text-sm transition-all resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAddTopic(subject.id)}
                                                        disabled={!newTopicName.trim()}
                                                        className="bg-[#a0522d] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#804224] disabled:opacity-50 transition"
                                                    >
                                                        Add Topic
                                                    </button>
                                                    <button
                                                        onClick={() => { setAddingTopicFor(null); setNewTopicName(''); setNewTopicDesc(''); }}
                                                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingTopicFor(subject.id)}
                                                className="text-[#a0522d] text-sm font-semibold flex items-center gap-1.5 hover:text-[#804224] transition-colors mt-2"
                                            >
                                                <FaPlus size={10} /> Add Topic
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
