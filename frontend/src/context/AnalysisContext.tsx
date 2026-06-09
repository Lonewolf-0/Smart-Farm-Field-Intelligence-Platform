import React, { createContext, useContext } from 'react';

export interface AnalysisData {
  soil?: any;
  ndvi?: any;
  weather?: any;
  irrigation?: any;
  crop?: any;
  fertilizer?: any;
  pesticide?: any;
  risks?: any;
}

interface AnalysisContextType {
  data: AnalysisData | null;
  timestamp: number | null;
  isLoading: boolean;
  isStale24h: boolean;
  isStale7d: boolean;
  refreshAnalysis: () => Promise<void>;
  hasCachedData: boolean;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{
  value: AnalysisContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisContext = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
};
