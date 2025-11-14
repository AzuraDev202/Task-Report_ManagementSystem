'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface DashboardContextType {
  needsRefresh: boolean;
  triggerRefresh: () => void;
  clearRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const triggerRefresh = useCallback(() => {
    setNeedsRefresh(true);
  }, []);

  const clearRefresh = useCallback(() => {
    setNeedsRefresh(false);
  }, []);

  return (
    <DashboardContext.Provider value={{ needsRefresh, triggerRefresh, clearRefresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
