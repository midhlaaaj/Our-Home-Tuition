"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ClassNavbar from '../components/ClassNavbar';
import { classesData } from '../constants/classesData';
import { useCurriculum } from '../context/CurriculumContext';
import { supabase } from '../supabaseClient';
import BrandedLoading from '../components/BrandedLoading';
import { FaPlus, FaMinus, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';



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
    const params = useParams();
    const id = params?.id as string;
    const classInfo = classesData.find(c => c.id.toString() === id);
    const { curriculum, stateRegion, toggleStateRegion, setBookingData } = useCurriculum();
    const { showAlert } = useModal();
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Record<string, Topic[]>>({});
    const [expandedBoard, setExpandedBoard] = useState<string | null>(null);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalExpandedSubject, setModalExpandedSubject] = useState<string | null>(null);
    const [selectedUnits, setSelectedUnits] = useState<{ subject: Subject, topic: Topic }[]>([]);
    const [bookingType, setBookingType] = useState<'regular' | 'custom-units' | 'all-in-one'>('regular');
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [customInputs, setCustomInputs] = useState<Record<string, { unitNo: string, topicName: string }>>({});

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isModalOpen]);

    const allowedBookingTypes = React.useMemo(() => {
        const types = [
            { id: 'regular', label: 'Regular' },
            { id: 'custom-units', label: 'Custom Units' },
            { id: 'all-in-one', label: 'All In One' }
        ];
        const currentClassId = classInfo?.id || (id ? parseInt(id as string) : 0);
        return types.filter(type => type.id !== 'all-in-one' || (currentClassId > 0 && currentClassId <= 4));
    }, [classInfo, id]);

    // Track last visited class for redirection fallback
    useEffect(() => {
        if (id) {
            localStorage.setItem('last_visited_class_id', id.toString());
        }
    }, [id]);

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
    const router = useRouter();
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
                                    <h3 className="text-[#a0522d] font-bold text-sm uppercase tracking-wider">
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
                                                            <p className="text-gray-800 font-semibold text-sm tracking-tight group-hover:text-[#a0522d] transition-colors">{topic.name}</p>
                                                            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full shrink-0">{(topic.estimated_duration || 60) / 60} Hour</span>
                                                        </div>
                                                        {topic.description && (
                                                            <p className="text-gray-400 text-xs font-medium mt-1 leading-relaxed">{topic.description}</p>
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

    // Pre-fetch all topics if modal is open to ensure instant combo selections
    useEffect(() => {
        if (isModalOpen) {
            subjects.forEach(subject => {
                if (!topics[subject.id]) {
                    fetchTopics(subject.id);
                }
            });
        }
    }, [isModalOpen, subjects]);

    const toggleModalSubject = (subjectId: string) => {
        if (modalExpandedSubject === subjectId) {
            setModalExpandedSubject(null);
        } else {
            setModalExpandedSubject(subjectId);
            if (!topics[subjectId]) {
                fetchTopics(subjectId);
            }
        }
    };

    // Open modal with all subjects collapsed by default
    const handleOpenModal = () => {
        setIsModalOpen(true);
        setModalExpandedSubject(null);
    };

    const toggleUnitSelection = (subject: Subject, topic: Topic) => {
        const isSelected = selectedUnits.some(u => u.topic.id === topic.id);
        
        const limit = bookingType === 'custom-units' ? 4 : 2;
        if (!isSelected && selectedUnits.length >= limit) {
            showAlert(`Maximum ${limit} units can be selected for this mode.`);
            return;
        }

        setSelectedUnits(prev => {
            if (isSelected) {
                return prev.filter(u => u.topic.id !== topic.id);
            } else {
                return [...prev, { subject, topic }];
            }
        });
    };

    const handleBookingTypeChange = (type: 'regular' | 'custom-units' | 'all-in-one') => {
        setBookingType(type);
        if (type === 'all-in-one') {
            setSelectedUnits([]); // Clear all before combo logic
            const allSelected: { subject: Subject, topic: Topic }[] = [];
            let count = 0;
            for (const subject of subjects) {
                const subjectTopics = topics[subject.id];
                if (subjectTopics && subjectTopics.length > 0) {
                    allSelected.push({ subject, topic: subjectTopics[0] });
                    count++;
                }
                if (count >= 2) break; // Fixed 2 hours
            }
            setSelectedUnits(allSelected);
        } else {
            const limit = type === 'custom-units' ? 4 : 2;
            if (selectedUnits.length > limit) {
                setSelectedUnits([]);
                showAlert(`Selections cleared: ${type} mode allows maximum ${limit} units.`);
            }
        }
    };
    const handleAddCustomSubject = async () => {
        console.log("handleAddCustomSubject called, user:", user?.id, "name:", newSubjectName);
        if (!newSubjectName.trim()) return;
        if (!user) {
            console.warn("Add Subject failed: User not logged in");
            showAlert("You must be signed in to add custom subjects. Please sign in or create an account.");
            return;
        }

        try {
            const newSubject = {
                class_id: parseInt(id),
                name: newSubjectName.trim(),
                curriculum: curriculum,
                user_id: user.id
            };

            console.log("Inserting subject into Supabase:", newSubject);
            const { data, error } = await supabase
                .from('class_subjects')
                .insert(newSubject)
                .select()
                .single();

            if (error) {
                console.error("Supabase Subject Insert Error:", error);
                throw new Error(error.message);
            }

            console.log("Subject inserted successfully:", data);
            setSubjects(prev => [...prev, data as Subject]);
            setNewSubjectName('');
            setIsAddingSubject(false);
            setModalExpandedSubject(data.id);
        } catch (error: any) {
            console.error("Add Subject Exception:", error);
            showAlert("Failed to save subject. Have you run the SQL migration script yet? Error: " + error.message);
        }
    };

    const handleAddCustomUnit = async (subject: Subject) => {
        const inputs = customInputs[subject.id];
        console.log("handleAddCustomUnit called for subject:", subject.name, "inputs:", inputs);
        
        if (!inputs?.unitNo || !inputs?.topicName) {
            showAlert("Please enter both Unit and Topic name.");
            return;
        }
        
        if (!user) {
            console.warn("Add Unit failed: User not logged in");
            showAlert("You must be signed in to add custom units.");
            return;
        }

        try {
            const newTopic = {
                subject_id: subject.id,
                unit_no: parseInt(inputs.unitNo) || 1,
                unit_title: inputs.unitNo,
                name: inputs.topicName,
                estimated_duration: 30, // 30m each allows 4 units in 2 hours
                unit_price: 100,
                user_id: user.id
            };

            console.log("Inserting topic into Supabase:", newTopic);
            const { data, error } = await supabase
                .from('class_topics')
                .insert(newTopic)
                .select()
                .single();

            if (error) {
                console.error("Supabase Topic Insert Error:", error);
                throw new Error(error.message);
            }

            console.log("Topic inserted successfully:", data);
            // Add to topics state
            setTopics(prev => ({
                ...prev,
                [subject.id]: [...(prev[subject.id] || []), data as Topic]
            }));

            // Only add to selected if under limit
            if (selectedUnits.length < 4) {
                setSelectedUnits(prev => [...prev, { subject, topic: data as Topic }]);
            } else {
                showAlert("Subject added to your list, but you can only select 4 for this booking.");
            }

            // Clear inputs
            setCustomInputs(prev => ({
                ...prev,
                [subject.id]: { unitNo: '', topicName: '' }
            }));
        } catch (error: any) {
            console.error("Add Unit Exception:", error);
            showAlert("Failed to save unit. Have you run the SQL migration script? Error: " + error.message);
        }
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
        const totalDuration = selectedUnits.reduce((acc, curr) => acc + (curr.topic.estimated_duration || 60), 0);
        
        // For custom units, we allow 1-4 units and treat it as a 2-hour session
        const isCustomValid = bookingType === 'custom-units' && selectedUnits.length >= 1 && selectedUnits.length <= 4;
        const isRegularValid = bookingType !== 'custom-units' && totalDuration === 120;

        if (!isCustomValid && !isRegularValid) {
            showAlert(bookingType === 'custom-units' 
                ? "Please select at least 1 unit (up to 4)." 
                : "Exactly 2 hour booking is required. (Currently: " + totalDuration/60 + " hours)");
            return;
        }

        setIsModalOpen(false);
        // Ensure bookingData contains the forced 2-hour duration if custom
        const finalUnits = bookingType === 'custom-units' 
            ? selectedUnits.map(u => ({ ...u, topic: { ...u.topic, estimated_duration: 120 / selectedUnits.length } }))
            : selectedUnits;

        setBookingData({ selectedUnits: finalUnits, classInfo, curriculum, bookingType });
        if (classInfo?.id) {
            localStorage.setItem('last_visited_class_id', classInfo.id.toString());
        }
        router.push('/book-session');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-[68px]">
            <Header />
            {!isModalOpen && <ClassNavbar />}

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
                                            <div className="bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-300 flex flex-col w-full py-8">
                                                {loading ? (
                                                    <div className="flex justify-center w-full">
                                                        <BrandedLoading size="md" />
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
                                        <BrandedLoading size="lg" />
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-sans">
                    <style>{`#ai-chat-button { display: none !important; }`}</style>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
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
                            {/* Curriculum Selector Component in Modal */}
                            <div className="mb-6 md:hidden">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Curriculum</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'CBSE', label: 'CBSE' },
                                        { id: 'ANDHRA', label: 'Andhra' },
                                        { id: 'TELANGANA', label: 'Telangana' }
                                    ].map(board => {
                                        const isSelected = curriculum === 'CBSE' ? board.id === 'CBSE' : stateRegion === board.id;
                                        return (
                                            <button
                                                key={board.id}
                                                onClick={() => {
                                                    if (board.id === 'CBSE') {
                                                        setCurriculum('CBSE');
                                                    } else {
                                                        setCurriculum('STATE');
                                                        setStateRegion(board.id as any);
                                                    }
                                                }}
                                                className={`py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl border-2 transition-all ${
                                                    isSelected
                                                        ? 'bg-[#1B2A5A] border-[#1B2A5A] text-white shadow-lg'
                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-[#1B2A5A]/30'
                                                }`}
                                            >
                                                {board.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={`mb-6 grid ${allowedBookingTypes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                                {allowedBookingTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleBookingTypeChange(type.id as any)}
                                        className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all ${
                                            bookingType === type.id
                                                ? 'bg-[#1B2A5A] border-[#1B2A5A] text-white shadow-lg'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-[#1B2A5A]/30'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>


                            {subjects.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No subjects available.</p>
                            ) : (
                                <div className="space-y-4 pb-20">
                                    {bookingType === 'all-in-one' ? (
                                        /* Simplified Combo View for All In One */
                                        <div className="grid grid-cols-1 gap-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Select a 2-hour Subject Combo</p>
                                            {(() => {
                                                const combos: { name: string, subjects: Subject[] }[] = [];
                                                for (let i = 0; i < subjects.length; i += 2) {
                                                    if (subjects[i] && subjects[i+1]) {
                                                        combos.push({ 
                                                            name: `${subjects[i].name} & ${subjects[i+1].name}`, 
                                                            subjects: [subjects[i], subjects[i+1]] 
                                                        });
                                                    }
                                                }
                                                // If odd number or just one combo, add a mixed one if possible
                                                if (subjects.length >= 3 && combos.length < 2) {
                                                    combos.push({ 
                                                        name: `${subjects[0].name} & ${subjects[2].name}`, 
                                                        subjects: [subjects[0], subjects[2]] 
                                                    });
                                                }

                                                return combos.map((combo, idx) => {
                                                    const isSelected = combo.subjects.every(s => selectedUnits.some(u => u.subject.id === s.id));
                                                    
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedUnits([]);
                                                                } else {
                                                                    const newUnits: { subject: Subject, topic: Topic }[] = [];
                                                                    combo.subjects.forEach(s => {
                                                                        const subjectTopics = topics[s.id] || [];
                                                                        if (subjectTopics.length > 0) {
                                                                            newUnits.push({ subject: s, topic: subjectTopics[0] });
                                                                        }
                                                                    });
                                                                    setSelectedUnits(newUnits);
                                                                }
                                                            }}
                                                            className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${
                                                                isSelected 
                                                                    ? 'bg-gray-50 border-gray-200 shadow-sm' 
                                                                    : 'bg-white border-gray-100 hover:border-gray-200 text-gray-500 opacity-80 hover:opacity-100'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#1B2A5A] border-[#1B2A5A]' : 'border-gray-200 bg-white'}`}>
                                                                    {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                </div>
                                                                <div className="text-left">
                                                                    <h3 className={`font-black uppercase tracking-tight text-base ${isSelected ? 'text-[#1B2A5A]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                                        {combo.name}
                                                                    </h3>
                                                                    <p className="text-[10px] font-bold text-green-600 leading-none mt-1">
                                                                        2 Hours Combined Session
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 opacity-0"></div>
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {subjects.map(subject => (
                                                <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                    <button 
                                                        onClick={() => toggleModalSubject(subject.id)}
                                                        className="w-full px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors"
                                                    >
                                                        <h3 className="font-black text-gray-900 tracking-tight text-sm text-left">{subject.name}</h3>
                                                        <span className="text-gray-400 shrink-0 ml-4">
                                                            {modalExpandedSubject === subject.id ? <FaMinus size={12} /> : <FaPlus size={12} />}
                                                        </span>
                                                    </button>
                                                    {modalExpandedSubject === subject.id && (
                                                        <div className="p-4 bg-white border-t border-gray-50">
                                                            {bookingType === 'custom-units' ? (
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Name/No</label>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="e.g. Unit 1"
                                                                                value={customInputs[subject.id]?.unitNo || ''}
                                                                                onChange={(e) => setCustomInputs(prev => ({ ...prev, [subject.id]: { ...prev[subject.id], unitNo: e.target.value } }))}
                                                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a0522d]/20"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Topic Name</label>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="e.g. Algebra Basics"
                                                                                value={customInputs[subject.id]?.topicName || ''}
                                                                                onChange={(e) => setCustomInputs(prev => ({ ...prev, [subject.id]: { ...prev[subject.id], topicName: e.target.value } }))}
                                                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a0522d]/20"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleAddCustomUnit(subject)}
                                                                        className="w-full py-2 bg-[#a0522d] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#804224] transition-all"
                                                                    >
                                                                        Add Custom Unit
                                                                    </button>
                                                                    
                                                                    {/* Show already added custom units for this subject */}
                                                                    {selectedUnits.filter(u => u.subject.id === subject.id).length > 0 && (
                                                                        <div className="pt-2 border-t border-gray-100">
                                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Added Units:</p>
                                                                            <div className="space-y-2">
                                                                                {selectedUnits.filter(u => u.subject.id === subject.id).map((u, idx) => (
                                                                                    <div key={idx} className="flex items-center justify-between bg-orange-50/50 px-3 py-2 rounded-lg">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <FaCheckCircle className="text-green-500" size={12} />
                                                                                            <span className="text-xs font-bold text-gray-700">{u.topic.unit_title}: {u.topic.name}</span>
                                                                                        </div>
                                                                                        <button 
                                                                                            onClick={() => setSelectedUnits(prev => prev.filter(item => item.topic.id !== u.topic.id))}
                                                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                                                        >
                                                                                            <FaTimes size={10} />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
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
                                                                                        <p className="text-sm font-bold text-[#a0522d] tracking-wide">
                                                                                            Unit {group.unit_no}{group.unit_title ? `: ${group.unit_title}` : ''}
                                                                                        </p>
                                                                                    </div>
                                                                                    {group.topics.map(topic => {
                                                                                        const isSelected = selectedUnits.some(u => u.topic.id === topic.id);
                                                                                        return (
                                                                                            <label
                                                                                                key={topic.id}
                                                                                                className={`flex items-start gap-4 px-6 py-3 cursor-pointer transition-all ${
                                                                                                    isSelected 
                                                                                                        ? 'bg-orange-50/30' 
                                                                                                        : (selectedUnits.length >= (bookingType === ('custom-units' as string) ? 4 : 2))
                                                                                                            ? 'opacity-40 grayscale pointer-events-none bg-gray-50/50'
                                                                                                            : 'hover:bg-orange-50/50'
                                                                                                }`}
                                                                                            >
                                                                                                <div className="mt-0.5">
                                                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#a0522d] border-[#a0522d]' : 'border-gray-200 bg-white'}`}>
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
                                                                                                            <p className={`text-base font-semibold ${isSelected ? 'text-[#a0522d]' : 'text-gray-800'}`}>{topic.name}</p>
                                                                                                        </div>
                                                                                                        <div className="text-right shrink-0">
                                                                                                            <p className="text-[10px] font-bold text-green-500 leading-none mt-1">({(topic.estimated_duration || 60) / 60} Hour)</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    {topic.description && (
                                                                                                        <p className="text-sm text-gray-500 mt-1 ml-4 line-clamp-2">{topic.description}</p>
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
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {bookingType === 'custom-units' && (
                                                <div className="mt-6">
                                                    {!isAddingSubject ? (
                                                        <button 
                                                            onClick={() => setIsAddingSubject(true)}
                                                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#a0522d]/30 hover:text-[#a0522d] transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
                                                        >
                                                            <FaPlus size={12} /> Add Other Subject
                                                        </button>
                                                    ) : (
                                                        <div className="bg-white p-4 rounded-xl border border-[#a0522d]/30 shadow-sm space-y-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Subject Name</label>
                                                                <input 
                                                                    autoFocus
                                                                    type="text" 
                                                                    placeholder="e.g. French, Programming, etc."
                                                                    value={newSubjectName}
                                                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubject()}
                                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a0522d]/20"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={handleAddCustomSubject}
                                                                    className="flex-1 py-2.5 bg-[#1B2A5A] text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                                                                >
                                                                    Add Subject
                                                                </button>
                                                                <button 
                                                                    onClick={() => setIsAddingSubject(false)}
                                                                    className="px-4 py-2.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full md:w-auto gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Selected</span>
                                        <span className="text-lg md:text-xl font-black text-gray-900 leading-none">Dynamic Pricing</span>
                                    </div>
                                    <div className="flex flex-col text-right md:text-left">
                                        <span className="text-[9px] font-bold text-gray-400 leading-none">
                                            ({selectedUnits.length} Units)
                                        </span>
                                        <span className="text-[9px] font-bold text-green-600 mt-0.5 leading-none">
                                            {bookingType === 'custom-units' ? '2' : (selectedUnits.reduce((acc, curr) => acc + (curr.topic.estimated_duration || 60), 0) / 60)} Hours Est.
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                                    <button
                                        onClick={() => setSelectedUnits([])}
                                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors py-2"
                                        disabled={selectedUnits.length === 0}
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={handleProceedToBooking}
                                        disabled={selectedUnits.length === 0}
                                        className="flex-1 md:flex-none bg-[#a0522d] hover:bg-[#804224] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 md:py-3.5 rounded-[14px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-md active:scale-95"
                                    >
                                        Proceed to Booking
                                    </button>
                                </div>
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
