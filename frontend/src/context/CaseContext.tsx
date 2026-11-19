import React, { createContext, useContext, useState } from 'react';
import type { CaseSummary } from '../types/medical';

interface CaseContextType {
  activeCase: CaseSummary | null;
  setActiveCase: (c: CaseSummary | null) => void;
  clearCase: () => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'braintumor3d_active_case';

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCase, setActiveCaseState] = useState<CaseSummary | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setActiveCase = (c: CaseSummary | null) => {
    setActiveCaseState(c);
    if (c) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(c));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const clearCase = () => {
    setActiveCase(null);
  };

  return (
    <CaseContext.Provider value={{ activeCase, setActiveCase, clearCase }}>
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};
