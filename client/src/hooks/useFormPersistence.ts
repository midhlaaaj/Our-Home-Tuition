import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Normalize phone: strip non-digits, take last 10 digits
const normalizePhone = (phone?: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
};

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
    const { profile, user } = useAuth();
    const [formData, setFormData] = useState<T>(initialState);
    const isInitialMount = useRef(true);

    // 1. Initial Load: Merge Initial -> LocalStorage -> Profile -> OAuth metadata
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const parsedSavedData = savedData ? JSON.parse(savedData) : {};

        // Resolve best available values across all sources
        const resolvedName =
            profile?.name ||
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            '';

        const resolvedEmail =
            profile?.email ||
            user?.email ||
            user?.user_metadata?.email ||
            '';

        const resolvedPhone = normalizePhone(
            profile?.phone ||
            user?.user_metadata?.phone ||
            ''
        );

        const resolvedAddress = profile?.address || '';

        setFormData(prev => ({
            ...prev,
            ...parsedSavedData,
            // Authenticated data always wins over localStorage
            ...(resolvedName && { name: resolvedName, fullName: resolvedName }),
            ...(resolvedEmail && { email: resolvedEmail }),
            ...(resolvedPhone && { phone: resolvedPhone }),
            ...(resolvedAddress && { address: resolvedAddress }),
        }));
    }, [profile, user]);

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
