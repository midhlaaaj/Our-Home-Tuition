"use client";

import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type Curriculum = 'CBSE' | 'STATE';

type StateRegion = 'ANDHRA' | 'TELANGANA';

export interface BookingData {
    selectedUnits: { subject: any, topic: any }[];
    classInfo: any;
    curriculum: string;
}

interface CurriculumContextType {
    curriculum: Curriculum;
    toggleCurriculum: () => void;
    setCurriculum: (c: Curriculum) => void;
    stateRegion: StateRegion;
    toggleStateRegion: () => void;
    setStateRegion: (r: StateRegion) => void;
    bookingData: BookingData | null;
    setBookingData: (data: BookingData | null) => void;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [curriculum, setCurriculumState] = useState<Curriculum>('CBSE');
    const [stateRegion, setStateRegionState] = useState<StateRegion>('ANDHRA');
    const [bookingData, setBookingData] = useState<BookingData | null>(null);

    const toggleCurriculum = () => {
        setCurriculumState((prev) => (prev === 'CBSE' ? 'STATE' : 'CBSE'));
    };

    const setCurriculum = (c: Curriculum) => {
        setCurriculumState(c);
    };

    const toggleStateRegion = () => {
        setStateRegionState((prev) => (prev === 'ANDHRA' ? 'TELANGANA' : 'ANDHRA'));
    };

    const setStateRegion = (r: StateRegion) => {
        setStateRegionState(r);
    };

    return (
        <CurriculumContext.Provider value={{
            curriculum,
            toggleCurriculum,
            setCurriculum,
            stateRegion,
            toggleStateRegion,
            setStateRegion,
            bookingData,
            setBookingData
        }}>
            {children}
        </CurriculumContext.Provider>
    );
};

export const useCurriculum = () => {
    const context = useContext(CurriculumContext);
    if (!context) {
        throw new Error('useCurriculum must be used within a CurriculumProvider');
    }
    return context;
};
