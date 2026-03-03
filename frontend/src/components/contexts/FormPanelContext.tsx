'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface FormPanelContextType {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const FormPanelContext = createContext<FormPanelContextType | undefined>(undefined);

export function FormPanelProvider({ children }: { children: React.ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  return (
    <FormPanelContext.Provider value={{ isPanelOpen, openPanel, closePanel }}>
      {children}
    </FormPanelContext.Provider>
  );
}

export function useFormPanel() {
  const context = useContext(FormPanelContext);
  if (!context) {
    throw new Error('useFormPanel must be used within a FormPanelProvider');
  }
  return context;
}
