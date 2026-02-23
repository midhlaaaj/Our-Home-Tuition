import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type Curriculum = 'CBSE' | 'STATE';

interface CurriculumContextType {
    curriculum: Curriculum;
    toggleCurriculum: () => void;
    setCurriculum: (c: Curriculum) => void;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [curriculum, setCurriculumState] = useState<Curriculum>('CBSE');

    const toggleCurriculum = () => {
        setCurriculumState((prev) => (prev === 'CBSE' ? 'STATE' : 'CBSE'));
    };

    const setCurriculum = (c: Curriculum) => {
        setCurriculumState(c);
    };

    return (
        <CurriculumContext.Provider value={{ curriculum, toggleCurriculum, setCurriculum }}>
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
