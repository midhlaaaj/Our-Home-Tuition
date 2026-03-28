import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface PersistableData {
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
}

export const STORAGE_KEY = 'wh_form_persistence';

export const useFormPersistence = <T extends PersistableData>(initialState: T) => {
    const { profile } = useAuth();
    const [formData, setFormData] = useState<T>(initialState);
    const isInitialMount = useRef(true);

    // 1. Initial Load: Merge Initial -> LocalStorage -> Profile
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const parsedSavedData = savedData ? JSON.parse(savedData) : {};

        setFormData(prev => ({
            ...prev,
            ...parsedSavedData,
            // Profile data takes priority if user is logged in
            ...(profile?.name && { name: profile.name, fullName: profile.name }),
            ...(profile?.email && { email: profile.email }),
            ...(profile?.phone && { phone: profile.phone }),
            ...(profile?.address && { address: profile.address }),
        }));
    }, [profile]);

    // 2. Auto-Persistence: Watch formData and Save core fields
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const toPersist = {
            name: formData.name || formData.fullName,
            fullName: formData.fullName || formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address
        };
        
        // Remove undefined/empty to keep storage clean
        Object.keys(toPersist).forEach(key => {
            if (!(toPersist as any)[key]) delete (toPersist as any)[key];
        });

        if (Object.keys(toPersist).length > 0) {
            const existing = localStorage.getItem(STORAGE_KEY);
            const parsedExisting = existing ? JSON.parse(existing) : {};
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsedExisting, ...toPersist }));
        }
    }, [formData]);

    const updateField = useCallback((name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const clearPersistence = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        formData,
        setFormData,
        updateField,
        clearPersistence
    };
};
