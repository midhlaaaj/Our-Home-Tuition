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
    unit_price: number;
    estimated_duration: number;
}

const ClassPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const classInfo = classesData.find(c => c.id.toString() === id);
    const { curriculum, stateRegion, toggleStateRegion } = useCurriculum();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Record<string, Topic[]>>({});
    const [expandedBoard, setExpandedBoard] = useState<string | null>(null);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

    const [expandedUnits, setExpandedUnits] = useState<Record<string, number | null>>({});
    const navigate = useNavigate();
    const { setCurriculum, setStateRegion } = useCurriculum();

    const handleToggleBoard = (board: string) => {
        if (expandedBoard === board) {
            setExpandedBoard(null);
            return;
        }
        
        setExpandedBoard(board);
        setExpandedSubject(null);
        
        if (board === 'CBSE') {
            setCurriculum('CBSE');
        } else if (board === 'ANDHRA') {
            setCurriculum('STATE');
            setStateRegion('ANDHRA');
        } else if (board === 'TELANGANA') {
            setCurriculum('STATE');
            setStateRegion('TELANGANA');
        }
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

    const toggleUnit = (subjectId: string, unitNo: number) => {
        setExpandedUnits(prev => ({
            ...prev,
            [subjectId]: prev[subjectId] === unitNo ? null : unitNo
        }));
    };

    const renderSubjectDetails = (subject: Subject) => {
        return (
            <div className="space-y-3">
                {!topics[subject.id] ? (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-3 border-gray-200 border-t-[#a0522d] rounded-full animate-spin"></div>
                    </div>
                ) : topics[subject.id].length === 0 ? (
                    <p className="text-gray-400 text-xs font-bold py-2">No units available yet.</p>
                ) : (
                    <div className="space-y-3">
                        {groupTopicsByUnit(topics[subject.id]).map((group) => (
                            <div key={group.unit_no} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleUnit(subject.id, group.unit_no)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <h3 className="text-[#a0522d] font-bold text-[10px] uppercase tracking-wider">
                                        Unit {group.unit_no}{group.unit_title ? `: ${group.unit_title}` : ''}
                                    </h3>
                                    <span className="text-gray-300">
                                        {expandedUnits[subject.id] === group.unit_no ? <FaMinus size={8} /> : <FaPlus size={8} />}
                                    </span>
                                </button>
                                
                                {expandedUnits[subject.id] === group.unit_no && (
                                    <div className="px-4 py-3 bg-white border-t border-gray-50 animate-in fade-in duration-200">
                                        <ul className="space-y-3">
                                            {group.topics.map((topic) => (
                                                <li key={topic.id} className="flex items-start gap-3 py-1 group">
                                                    <span className="text-[#e69b48] font-bold text-xs mt-1 flex-shrink-0">•</span>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <p className="text-gray-800 font-semibold text-xs tracking-tight group-hover:text-[#a0522d] transition-colors">{topic.name}</p>
                                                            <span className="text-[9px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full shrink-0">{topic.estimated_duration || 60}m</span>
                                                        </div>
                                                        {topic.description && (
                                                            <p className="text-gray-400 text-[10px] font-medium mt-1 leading-relaxed">{topic.description}</p>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
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

    const toggleSubjectSelection = (subject: Subject) => {
        const subjectTopics = topics[subject.id] || [];
        if (subjectTopics.length === 0) return;

        const allSelected = subjectTopics.every(t => selectedUnits.some(u => u.topic.id === t.id));

        if (allSelected) {
            setSelectedUnits(prev => prev.filter(u => u.subject.id !== subject.id));
        } else {
            const otherUnits = selectedUnits.filter(u => u.subject.id !== subject.id);
            const newSelections = subjectTopics.map(t => ({ subject, topic: t }));
            setSelectedUnits([...otherUnits, ...newSelections]);
        }
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
                    <div className="min-h-[50vh]">                        <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-2 md:gap-4 flex-1">
                                <h1 className="text-2xl md:text-4xl font-bold text-[#1B2A5A] tracking-tight">{classInfo.label}</h1>
                                <div className="hidden md:flex items-center gap-2">
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${curriculum === 'CBSE' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {curriculum}
                                    </span>
                                    {curriculum === 'STATE' && (
                                        <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest bg-gray-100 text-gray-600">
                                            {stateRegion}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {/* Desktop Only Toggles */}
                                <div className="hidden md:flex items-center gap-3">
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
                                                className={`w-1/2 h-full bg-white rounded-full shadow-md text-[#1B2A5A] flex items-center justify-center text-[10px] font-bold transition-transform duration-300 ease-in-out ${stateRegion === 'TELANGANA' ? 'translate-x-full' : 'translate-x-0'}`}
                                            >
                                                {stateRegion}
                                            </div>
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={handleOpenModal}
                                    className="bg-[#a0522d] hover:bg-[#804224] text-white px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 shrink-0"
                                >
                                    Book Session
                                </button>
                            </div>
                        </div>


                        {/* Hierarchical Navigation */}
                        <div className="space-y-4">
                            {/* Board Selection - Mobile Hierarchical View */}
                            <div className="md:hidden space-y-3 mb-8">
                                {[
                                    { id: 'CBSE', label: 'CBSE Curriculum', sub: 'National Pattern' },
                                    { id: 'ANDHRA', label: 'Andhra State Board', sub: 'State Pattern' },
                                    { id: 'TELANGANA', label: 'Telangana State Board', sub: 'State Pattern' }
                                ].map((board) => (
                                    <div key={board.id} className={`rounded-2xl overflow-hidden transition-all duration-300 ${expandedBoard === board.id ? 'ring-2 ring-[#1B2A5A] shadow-xl' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                        <button
                                            onClick={() => handleToggleBoard(board.id)}
                                            className={`w-full px-5 py-5 text-left flex items-center justify-between ${expandedBoard === board.id ? 'bg-[#1B2A5A] text-white' : 'bg-white'}`}
                                        >
                                            <div className="flex-1">
                                                <h2 className="font-bold text-sm tracking-tight">{board.label}</h2>
                                                <p className={`text-[10px] font-medium opacity-60 ${expandedBoard === board.id ? 'text-white' : 'text-gray-400'}`}>{board.sub}</p>
                                            </div>
                                            <div className={`p-2 rounded-full transition-transform duration-300 ${expandedBoard === board.id ? 'bg-white/20 rotate-180' : 'bg-gray-50'}`}>
                                                <svg className={`w-4 h-4 ${expandedBoard === board.id ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        {expandedBoard === board.id && (
                                            <div className="bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-300">
                                                {loading ? (
                                                    <div className="flex justify-center py-8">
                                                        <div className="w-8 h-8 border-4 border-[#a0522d]/20 border-t-[#a0522d] rounded-full animate-spin"></div>
                                                    </div>
                                                ) : subjects.length === 0 ? (
                                                    <p className="text-center py-4 text-xs font-bold text-gray-400">No subjects found for this board</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {subjects.map((subject) => (
                                                            <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                                                <button
                                                                    onClick={() => toggleSubject(subject.id)}
                                                                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <span className="font-bold text-gray-800 text-xs tracking-tight uppercase">{subject.name}</span>
                                                                    <span className="text-gray-300">
                                                                        {expandedSubject === subject.id ? <FaMinus size={10} /> : <FaPlus size={10} />}
                                                                    </span>
                                                                </button>
                                                                
                                                                {expandedSubject === subject.id && (
                                                                    <div className="px-4 pb-4 animate-in fade-in duration-200">
                                                                        {renderSubjectDetails(subject)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Legacy Single List - Desktop View */}
                            <div className="hidden md:block">
                                {loading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#a0522d] rounded-full animate-spin"></div>
                                    </div>
                                ) : subjects.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold">No {curriculum} subjects available for this class yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {subjects.map((subject) => (
                                            <div key={subject.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                                <button
                                                    onClick={() => toggleSubject(subject.id)}
                                                    className="w-full flex items-center justify-between px-8 py-6 text-left active:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-bold text-[#1B2A5A] text-xl tracking-tight">{subject.name}</span>
                                                    <div className={`p-2 rounded-full transition-colors ${expandedSubject === subject.id ? 'bg-[#a0522d] text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                        {expandedSubject === subject.id ? <FaMinus size={14} /> : <FaPlus size={14} />}
                                                    </div>
                                                </button>
                                                
                                                {expandedSubject === subject.id && (
                                                    <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                                                        {renderSubjectDetails(subject)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
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
                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                                <h3 className="font-black text-gray-900 tracking-tight text-sm">{subject.name}</h3>
                                                {topics[subject.id] && topics[subject.id].length > 0 && (
                                                    <button
                                                        onClick={() => toggleSubjectSelection(subject)}
                                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all border ${
                                                            topics[subject.id].every(t => selectedUnits.some(u => u.topic.id === t.id))
                                                                ? 'bg-[#a0522d] text-white border-[#a0522d]'
                                                                : 'bg-white text-[#a0522d] border-[#a0522d]/20 hover:border-[#a0522d]/50'
                                                        }`}
                                                    >
                                                        {topics[subject.id].every(t => selectedUnits.some(u => u.topic.id === t.id))
                                                            ? 'Selected All'
                                                            : 'Select Entire Subject'}
                                                    </button>
                                                )}
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
                                                                                <div className="flex items-center justify-between gap-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-[#e69b48]">•</span>
                                                                                        <p className={`text-sm font-semibold ${isSelected ? 'text-[#a0522d]' : 'text-gray-800'}`}>{topic.name}</p>
                                                                                    </div>
                                                                                    <div className="text-right shrink-0">
                                                                                        <p className="text-[10px] font-black text-gray-400 leading-none">₹{topic.unit_price || 100}</p>
                                                                                        <p className="text-[9px] font-bold text-green-500 leading-none mt-1">({topic.estimated_duration || 60}m)</p>
                                                                                    </div>
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
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Selected</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-black text-gray-900 leading-none">
                                        ₹{selectedUnits.reduce((acc, curr) => acc + (curr.topic.unit_price || 100), 0)}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400">
                                            ({selectedUnits.length} unit{selectedUnits.length !== 1 ? 's' : ''})
                                        </span>
                                        <span className="text-[10px] font-bold text-green-600">
                                            {selectedUnits.reduce((acc, curr) => acc + (curr.topic.estimated_duration || 60), 0)} Minutes Est.
                                        </span>
                                    </div>
                                </div>
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
