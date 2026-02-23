import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ClassNavbar from '../components/ClassNavbar';
import { classesData } from '../constants/classesData';
import { useCurriculum } from '../context/CurriculumContext';
import { supabase } from '../supabaseClient';
import { FaPlus, FaMinus } from 'react-icons/fa';

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
}

const ClassPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const classInfo = classesData.find(c => c.id.toString() === id);
    const { curriculum } = useCurriculum();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Record<string, Topic[]>>({});
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch subjects for this class filtered by curriculum
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('class_subjects')
                    .select('*')
                    .eq('class_id', parseInt(id))
                    .eq('curriculum', curriculum)
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
    }, [id, curriculum]);

    // Fetch topics when a subject is expanded
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-[64px]">
            <Header bgClass="bg-[#e69b48]" />
            <div className="w-full">
                <ClassNavbar />
            </div>

            <main className="flex-grow container mx-auto px-4 py-8">
                {classInfo ? (
                    <div className="min-h-[50vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-gray-800">{classInfo.label}</h1>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold ${curriculum === 'CBSE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                }`}>
                                {curriculum}
                            </span>
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
                                            <span className="font-medium text-gray-800 text-base">{subject.name}</span>
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
                                                    <ul className="space-y-2">
                                                        {topics[subject.id].map((topic, index) => (
                                                            <li key={topic.id} className="flex items-start gap-3 py-2">
                                                                <span className="text-[#e69b48] font-bold text-sm mt-0.5 flex-shrink-0">
                                                                    {index + 1}.
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

            <Footer />
        </div>
    );
};

export default ClassPage;
