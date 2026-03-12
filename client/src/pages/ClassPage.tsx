import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ClassNavbar from '../components/ClassNavbar';
import { classesData } from '../constants/classesData';
import { useCurriculum } from '../context/CurriculumContext';
import { supabase } from '../supabaseClient';
import { FaPlus, FaMinus, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface Subject {
    id: string;
    class_id: number;
    name: string;
    curriculum: string;
}

interface Topic {
    id: string;
    subject_id: string;
    name: string;
    description: string | null;
    unit_no: number;
    unit_title: string | null;
}

const ClassPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const classInfo = classesData.find(c => c.id.toString() === id);
    const { curriculum, stateRegion, toggleStateRegion } = useCurriculum();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Record<string, Topic[]>>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState<{ subject: Subject, topic: Topic }[]>([]);

    // Fetch subjects for this class filtered by curriculum
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!id) return;
            setLoading(true);
            try {
                let query = supabase
                    .from('class_subjects')
                    .select('*')
                    .eq('class_id', parseInt(id))
                    .eq('curriculum', curriculum);
                
                if (curriculum === 'STATE') {
                    query = query.eq('state_region', stateRegion);
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

        fetchSubjects();
        setExpandedSubject(null);
        setTopics({});
    }, [id, curriculum, stateRegion]);

    // Fetch topics when a subject is expanded
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

    // Helper to group topics by unit_no
    const groupTopicsByUnit = (subjectTopics: Topic[]) => {
        const groups: Record<number, { unit_no: number, unit_title: string | null, topics: Topic[] }> = {};
        subjectTopics.forEach(topic => {
            const unitNo = topic.unit_no || 1;
            if (!groups[unitNo]) {
                groups[unitNo] = {
                    unit_no: unitNo,
                    unit_title: topic.unit_title,
                    topics: []
                };
            }
            groups[unitNo].topics.push(topic);
        });
        return Object.values(groups).sort((a, b) => a.unit_no - b.unit_no);
    };

    const toggleSubject = (subjectId: string) => {
        if (expandedSubject === subjectId) {
            setExpandedSubject(null);
        } else {
            setExpandedSubject(subjectId);
            if (!topics[subjectId]) {
                fetchTopics(subjectId);
            }
        }
    };

    // Pre-fetch all topics when modal opens to ensure smooth UX
    const handleOpenModal = () => {
        setIsModalOpen(true);
        subjects.forEach(subject => {
            if (!topics[subject.id]) {
                fetchTopics(subject.id);
            }
        });
    };

    const toggleUnitSelection = (subject: Subject, topic: Topic) => {
        setSelectedUnits(prev => {
            const isSelected = prev.some(u => u.topic.id === topic.id);
            if (isSelected) {
                return prev.filter(u => u.topic.id !== topic.id);
            } else {
                return [...prev, { subject, topic }];
            }
        });
    };

    const handleProceedToBooking = () => {
        setIsModalOpen(false);
        navigate('/book-session', { state: { selectedUnits, classInfo, curriculum } });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-[64px]">
            <Header />
            <div className="w-full">
                <ClassNavbar />
            </div>

            <main className="flex-grow container mx-auto px-4 py-8">
                {classInfo ? (
                    <div className="min-h-[50vh]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold text-gray-800">{classInfo.label}</h1>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${curriculum === 'CBSE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {curriculum}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                {curriculum === 'STATE' && (
                                    <button
                                        onClick={toggleStateRegion}
                                        className="relative w-40 h-10 bg-[#1B2A5A] rounded-full flex items-center p-1 cursor-pointer shadow-inner overflow-hidden border border-white/10"
                                        aria-label="Toggle State Region"
                                    >
                                        <div className="absolute inset-0 grid grid-cols-2 items-center text-[10px] font-bold text-white/50 pointer-events-none select-none">
                                            <span className="text-center">ANDHRA</span>
                                            <span className="text-center">TELANGANA</span>
                                        </div>
                                        <div
                                            className={`w-1/2 h-full bg-white rounded-full shadow-md text-[#1B2A5A] flex items-center justify-center text-[10px] font-bold transition-transform duration-300 ease-in-out ${stateRegion === 'TELANGANA' ? 'translate-x-full' : 'translate-x-0'
                                                }`}
                                        >
                                            {stateRegion}
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={handleOpenModal}
                                    className="bg-[#a0522d] hover:bg-[#804224] text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
                                >
                                    Book Session
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#e69b48] rounded-full animate-spin"></div>
                            </div>
                        ) : subjects.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <p className="text-lg">No {curriculum} subjects available for this class yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {subjects.map((subject) => (
                                    <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        {/* Subject Accordion Header */}
                                        <button
                                            onClick={() => toggleSubject(subject.id)}
                                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-semibold text-gray-900 text-lg tracking-tight">{subject.name}</span>
                                            <span className="text-gray-400 flex-shrink-0 ml-4">
                                                {expandedSubject === subject.id ? <FaMinus size={14} /> : <FaPlus size={14} />}
                                            </span>
                                        </button>

                                        {/* Expanded Topics */}
                                        {expandedSubject === subject.id && (
                                            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                                                {!topics[subject.id] ? (
                                                    <div className="flex justify-center py-4">
                                                        <div className="w-6 h-6 border-3 border-gray-200 border-t-[#e69b48] rounded-full animate-spin"></div>
                                                    </div>
                                                ) : topics[subject.id].length === 0 ? (
                                                    <p className="text-gray-400 text-sm py-2">No topics available yet.</p>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {groupTopicsByUnit(topics[subject.id]).map((group) => (
                                                            <div key={group.unit_no} className="space-y-2">
                                                                <h3 className="text-[#a0522d] font-bold text-xs tracking-wide">
                                                                    Unit {group.unit_no}{group.unit_title ? `: ${group.unit_title}` : ''}
                                                                </h3>
                                                                <ul className="space-y-2 pl-2">
                                                                    {group.topics.map((topic) => (
                                                                        <li key={topic.id} className="flex items-start gap-3 py-1">
                                                                            <span className="text-[#e69b48] font-bold text-sm mt-0.5 flex-shrink-0">
                                                                                •
                                                                            </span>
                                                                            <div>
                                                                                <p className="text-gray-800 font-medium text-sm">{topic.name}</p>
                                                                                {topic.description && (
                                                                                    <p className="text-gray-500 text-xs mt-1">{topic.description}</p>
                                                                                )}
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold text-gray-800">Class not found</h2>
                        <p className="text-gray-500 mt-2">The class you are looking for does not exist.</p>
                    </div>
                )}
            </main>

            {/* Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Select Units to Book</h2>
                                <p className="text-sm text-gray-500 mt-1">Choose specific topics from {classInfo?.label} ({curriculum})</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {subjects.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No subjects available.</p>
                            ) : (
                                <div className="space-y-4">
                                    {subjects.map(subject => (
                                        <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                                <h3 className="font-black text-gray-900 tracking-tight text-sm">{subject.name}</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {!topics[subject.id] ? (
                                                    <div className="px-4 py-3 text-sm text-gray-500">Loading topics...</div>
                                                ) : topics[subject.id].length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-500">No units available.</div>
                                                ) : (
                                                    <div className="divide-y divide-gray-100">
                                                        {groupTopicsByUnit(topics[subject.id]).map((group) => (
                                                            <div key={group.unit_no} className="bg-white">
                                                                <div className="px-4 py-2 bg-gray-50/50">
                                                                    <p className="text-[10px] font-bold text-[#a0522d] tracking-wide">
                                                                        Unit {group.unit_no}{group.unit_title ? `: ${group.unit_title}` : ''}
                                                                    </p>
                                                                </div>
                                                                {group.topics.map(topic => {
                                                                    const isSelected = selectedUnits.some(u => u.topic.id === topic.id);
                                                                    return (
                                                                        <label
                                                                            key={topic.id}
                                                                            className={`flex items-start gap-4 px-6 py-3 cursor-pointer hover:bg-orange-50/50 transition-colors ${isSelected ? 'bg-orange-50/30' : ''}`}
                                                                        >
                                                                            <div className="mt-0.5">
                                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#a0522d] border-[#a0522d]' : 'border-gray-300 bg-white'}`}>
                                                                                    {isSelected && <svg className="w-3.5 h-3.5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                                </div>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="sr-only"
                                                                                    checked={isSelected}
                                                                                    onChange={() => toggleUnitSelection(subject, topic)}
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[#e69b48]">•</span>
                                                                                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#a0522d]' : 'text-gray-800'}`}>{topic.name}</p>
                                                                                </div>
                                                                                {topic.description && (
                                                                                    <p className="text-xs text-gray-500 mt-1 ml-4 line-clamp-2">{topic.description}</p>
                                                                                )}
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between sticky bottom-0 z-10">
                            <div className="text-sm font-medium text-gray-600">
                                {selectedUnits.length} unit{selectedUnits.length !== 1 ? 's' : ''} selected
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedUnits([])}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                                    disabled={selectedUnits.length === 0}
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={handleProceedToBooking}
                                    disabled={selectedUnits.length === 0}
                                    className="bg-[#a0522d] hover:bg-[#804224] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
                                >
                                    Proceed to Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ClassPage;
