import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { FaCamera, FaImage, FaUserCircle, FaCheck } from 'react-icons/fa';
import Webcam from 'react-webcam';

interface AvatarSelectionModalProps {
    isOpen: boolean;
    onUpdate: (url: string) => void;
    onBack: () => void;
    currentAvatarUrl?: string;
}

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({ isOpen, onUpdate, onBack, currentAvatarUrl }) => {
    // Component is now designed to be embedded, but keeping the name for now to avoid breakages before rename
    // In reality, Header.tsx will render this conditionally inside the existing card.

    const [activeTab, setActiveTab] = useState<'prebuilt' | 'upload' | 'camera'>('prebuilt');
    const [prebuiltAvatars, setPrebuiltAvatars] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [cameraImage, setCameraImage] = useState<string | null>(null);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null);
    const [pendingFile, setPendingFile] = useState<File | Blob | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSelectedAvatar(currentAvatarUrl || null);
            setHasChanges(false);
            setPendingFile(null);
            setCameraImage(null);
        }
    }, [isOpen, currentAvatarUrl]);

    // Fetch prebuilt avatars
    useEffect(() => {
        if (isOpen && activeTab === 'prebuilt') {
            fetchPrebuiltAvatars();
        }
    }, [isOpen, activeTab]);

    const fetchPrebuiltAvatars = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .storage
                .from('prebuilt-avatars')
                .list();

            if (error) {
                console.error('Error fetching prebuilt avatars:', error);
            } else {
                const urls = data
                    .filter(file => file.name !== '.emptyFolderPlaceholder')
                    .map(file => {
                        const { data: publicUrlData } = supabase
                            .storage
                            .from('prebuilt-avatars')
                            .getPublicUrl(file.name);
                        return publicUrlData.publicUrl;
                    });
                setPrebuiltAvatars(urls);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPrebuilt = (url: string) => {
        setSelectedAvatar(url);
        setPendingFile(null);
        setHasChanges(true);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        const objectUrl = URL.createObjectURL(file);

        setSelectedAvatar(objectUrl);
        setPendingFile(file);
        setHasChanges(true);
        // Switch to upload tab to see preview if not already there (though file input is there)
    };

    const captureCamera = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCameraImage(imageSrc);
        }
    };

    const retakeCamera = () => {
        setCameraImage(null);
    };

    const confirmCameraImage = async () => {
        if (!cameraImage) return;

        try {
            // Convert base64 to blob
            const res = await fetch(cameraImage);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);

            setSelectedAvatar(objectUrl);
            setPendingFile(blob);
            setHasChanges(true);
            setCameraImage(null);
            setActiveTab('upload'); // Switch to upload tab to show the captured image preview
        } catch (error: any) {
            console.error('Error processing camera image:', error);
            alert('Failed to process image.');
        }
    };

    const handleSave = async () => {
        if (!selectedAvatar) return;

        setUploading(true);
        try {
            let finalUrl = selectedAvatar;

            // If there's a pending file (camera/upload), upload it first
            if (pendingFile) {
                const fileExt = pendingFile.type.split('/')[1] || 'jpg';
                const fileName = `${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, pendingFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                finalUrl = publicUrl;
            }

            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: finalUrl }
            });

            if (error) throw error;

            onUpdate(finalUrl);
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full bg-white animate-fade-in w-full">
            {/* Header */}
            <div className="bg-orange-500 p-4 shrink-0 flex justify-between items-center text-white">
                <h3 className="text-lg font-bold">Change Profile Picture</h3>
                {/* Back button removed in favor of explicit Cancel at bottom, or keep as "Cancel" icon? 
                    User asked for "Save and Cancel button", usually implies footer actions. 
                    Let's keep header simple or put Cancel there? 
                    I'll put Save/Cancel in a footer for clarity as requested.
                */}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'prebuilt' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('prebuilt')}
                >
                    <FaUserCircle className="inline mb-0.5 mr-1" /> Avatars
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <FaImage className="inline mb-0.5 mr-1" /> Gallery
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'camera' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('camera')}
                >
                    <FaCamera className="inline mb-0.5 mr-1" /> Camera
                </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto min-h-0 flex-1 bg-gray-50 relative">
                {activeTab === 'prebuilt' && (
                    <div className="grid grid-cols-3 gap-4">
                        {loading ? (
                            <p className="text-center col-span-3 text-gray-500 py-4">Loading avatars...</p>
                        ) : prebuiltAvatars.length === 0 ? (
                            <p className="text-center col-span-3 text-gray-500 py-4">No prebuilt avatars found.</p>
                        ) : (
                            prebuiltAvatars.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectPrebuilt(url)}
                                    className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${selectedAvatar === url ? 'border-orange-500 ring-4 ring-orange-200 scale-105' : 'border-transparent hover:border-orange-300'}`}
                                >
                                    <img src={url} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                                    {selectedAvatar === url && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <FaCheck className="text-white drop-shadow-md text-xl" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'upload' && (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                        {selectedAvatar && activeTab === 'upload' && (
                            <div className="mb-4 w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500 shadow-md">
                                <img src={selectedAvatar} alt="Selected" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <FaImage className="text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm mb-4">Choose an image from your device</p>
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium">
                            <span>Browse Gallery</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                        {uploading && <p className="mt-4 text-orange-500 text-sm animate-pulse">Uploading...</p>}
                    </div>
                )}

                {activeTab === 'camera' && (
                    <div className="flex flex-col items-center">
                        {cameraImage ? (
                            <div className="space-y-4 w-full">
                                <img src={cameraImage} alt="Captured" className="w-full rounded-xl shadow-md" />
                                <div className="flex gap-3">
                                    <button onClick={retakeCamera} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Retake</button>
                                    <button onClick={confirmCameraImage} className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50" disabled={uploading}>
                                        {uploading ? 'Processing...' : 'Use Photo'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 w-full">
                                <div className="relative rounded-xl overflow-hidden shadow-md bg-black w-full aspect-video flex items-center justify-center">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                </div>
                                <button onClick={captureCamera} className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold shadow-md flex items-center justify-center gap-2">
                                    <FaCamera /> Capture
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer with Save/Cancel */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white shrink-0">
                <button
                    onClick={onBack}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || uploading}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                    {uploading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default AvatarSelectionModal;
