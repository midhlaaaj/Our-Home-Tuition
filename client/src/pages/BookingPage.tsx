import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUsers, FaArrowLeft, FaCheckCircle, FaTrash } from 'react-icons/fa';

interface LocationState {
    selectedUnits: { subject: any, topic: any }[];
    classInfo: any;
    curriculum: string;
}

const BookingPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState;

    if (!state || !state.selectedUnits || state.selectedUnits.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-[64px]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">No session selected</h2>
                    <p className="text-gray-500 mt-2 mb-6">Please go back to the class page and select units to book.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-[#a0522d] hover:bg-[#804224] text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
                    >
                        Go Back
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const { selectedUnits, classInfo, curriculum } = state;

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [classType, setClassType] = useState<'individual' | 'group'>('individual');
    const [additionalStudents, setAdditionalStudents] = useState<{ id: string, name: string, email: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAddStudent = () => {
        setAdditionalStudents([...additionalStudents, { id: Date.now().toString(), name: '', email: '' }]);
    };

    const handleRemoveStudent = (id: string) => {
        setAdditionalStudents(additionalStudents.filter(s => s.id !== id));
    };

    const handleStudentChange = (id: string, field: 'name' | 'email', value: string) => {
        setAdditionalStudents(additionalStudents.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Prepare the payload (either for an API call or Supabase)
        const payload = {
            class_id: classInfo.id,
            curriculum,
            selected_units: selectedUnits.map(su => ({ subject_id: su.subject.id, topic_id: su.topic.id })),
            primary_student: { name, email, phone, address },
            class_type: classType,
            additional_students: classType === 'group' ? additionalStudents : []
        };

        // Simulate API delay, since we don't have a backend table ready for this yet
        console.log("Booking Payload:", payload);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-[64px]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto">
                    <FaCheckCircle className="text-green-500 text-6xl mb-6" />
                    <h2 className="text-3xl font-bold text-gray-800">Booking Confirmed!</h2>
                    <p className="text-gray-500 mt-3 mb-8">
                        Thank you for booking with Our Home Tuition. We have received your request for {selectedUnits.length} unit(s) and will contact you shortly at {phone}.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-[#a0522d] hover:bg-[#804224] text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-md"
                    >
                        Return Home
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-[64px]">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium mb-6"
                >
                    <FaArrowLeft size={14} /> Back to {classInfo.label}
                </button>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h1 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Booking</h1>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Personal Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Primary Student Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <FaUser />
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#a0522d] focus:border-[#a0522d] outline-none"
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <FaEnvelope />
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#a0522d] focus:border-[#a0522d] outline-none"
                                                    placeholder="Enter email"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                    <FaPhone />
                                                </div>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#a0522d] focus:border-[#a0522d] outline-none"
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="block text-sm font-medium text-gray-700">Full Address *</label>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!navigator.geolocation) {
                                                        alert("Geolocation is not supported by your browser");
                                                        return;
                                                    }
                                                    setAddress("Fetching location...");
                                                    navigator.geolocation.getCurrentPosition(async (position) => {
                                                        try {
                                                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`);
                                                            const data = await response.json();
                                                            if (data && data.display_name) {
                                                                setAddress(data.display_name);
                                                            } else {
                                                                setAddress("Could not determine address.");
                                                            }
                                                        } catch (error) {
                                                            console.error("Error fetching address:", error);
                                                            setAddress("Error fetching address.");
                                                        }
                                                    }, () => {
                                                        setAddress("Location access denied.");
                                                    });
                                                }}
                                                className="text-xs font-semibold text-[#a0522d] hover:text-[#804224] flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-200 transition-colors"
                                            >
                                                Use Current Location
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 text-gray-400">
                                                <FaMapMarkerAlt />
                                            </div>
                                            <textarea
                                                required
                                                value={address}
                                                onChange={e => setAddress(e.target.value)}
                                                rows={3}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#a0522d] focus:border-[#a0522d] outline-none resize-none"
                                                placeholder="Enter address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Class Type */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Class Format</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label
                                            className={`flex p-4 border rounded-xl cursor-pointer transition-all ${classType === 'individual' ? 'border-[#a0522d] bg-orange-50/50 ring-1 ring-[#a0522d]' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="radio"
                                                    name="classType"
                                                    value="individual"
                                                    checked={classType === 'individual'}
                                                    onChange={() => setClassType('individual')}
                                                    className="w-4 h-4 text-[#a0522d] border-gray-300 focus:ring-[#a0522d]"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <span className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                                                    <FaUser className={classType === 'individual' ? 'text-[#a0522d]' : 'text-gray-400'} />
                                                    Individual Class
                                                </span>
                                                <span className="block text-xs text-gray-500 mt-1">1-on-1 personalized attention for the student.</span>
                                            </div>
                                        </label>

                                        <label
                                            className={`flex p-4 border rounded-xl cursor-pointer transition-all ${classType === 'group' ? 'border-[#a0522d] bg-orange-50/50 ring-1 ring-[#a0522d]' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="radio"
                                                    name="classType"
                                                    value="group"
                                                    checked={classType === 'group'}
                                                    onChange={() => setClassType('group')}
                                                    className="w-4 h-4 text-[#a0522d] border-gray-300 focus:ring-[#a0522d]"
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <span className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                                                    <FaUsers className={classType === 'group' ? 'text-[#a0522d]' : 'text-gray-400'} />
                                                    Group Class
                                                </span>
                                                <span className="block text-xs text-gray-500 mt-1">Learn together with friends or siblings.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Dynamic Group Fields */}
                                {classType === 'group' && (
                                    <div className="space-y-4 pt-4 border-t border-gray-100 p-6 bg-gray-50 rounded-xl mt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-800">Additional Students</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">Please provide basic details for each extra student joining.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddStudent}
                                                className="text-[#a0522d] text-sm font-semibold hover:text-[#804224] transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
                                            >
                                                + Add Student
                                            </button>
                                        </div>

                                        {additionalStudents.length === 0 ? (
                                            <div className="text-center py-4 bg-white rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
                                                No additional students added yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {additionalStudents.map((student, index) => (
                                                    <div key={student.id} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative group">
                                                        <div className="absolute -top-2.5 -left-2.5 bg-[#a0522d] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-gray-50">
                                                            {index + 2}
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Name</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={student.name}
                                                                onChange={e => handleStudentChange(student.id, 'name', e.target.value)}
                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none text-sm focus:border-[#a0522d]"
                                                                placeholder="Enter name"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Email <span className="font-normal opacity-70">(optional)</span></label>
                                                            <input
                                                                type="email"
                                                                value={student.email}
                                                                onChange={e => handleStudentChange(student.id, 'email', e.target.value)}
                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none text-sm focus:border-[#a0522d]"
                                                                placeholder="Enter email"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveStudent(student.id)}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mb-[1px]"
                                                            title="Remove Student"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-6 border-t mt-8">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#a0522d] hover:bg-[#804224] disabled:bg-gray-400 text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-md flex justify-center items-center"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            'Confirm Booking'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-[80px]">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">Booking Summary</h2>

                            <div className="mb-6">
                                <p className="text-sm font-medium text-gray-500">Class & Curriculum</p>
                                <p className="text-lg font-bold text-gray-800">{classInfo.label} <span className="text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-600 ml-2">{curriculum}</span></p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-medium text-gray-500 border-b pb-2">Selected Units ({selectedUnits.length})</p>
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                                    {selectedUnits.map((item, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs font-semibold text-[#a0522d] uppercase tracking-wider mb-1">{item.subject.name}</p>
                                            <p className="text-sm font-medium text-gray-800">{item.topic.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-center text-gray-500 font-medium">
                                    A representative will contact you shortly to confirm the schedule and finalize the payment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BookingPage;
