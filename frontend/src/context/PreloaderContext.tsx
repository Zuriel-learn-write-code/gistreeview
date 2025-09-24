import React, { createContext, useContext, useState } from "react";

interface PreloaderContextType {
  showPreloader: boolean;
  setShowPreloader: (show: boolean) => void;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(
  undefined
);

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const [showPreloader, setShowPreloader] = useState(false);

  return (
    <PreloaderContext.Provider value={{ showPreloader, setShowPreloader }}>
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  const context = useContext(PreloaderContext);
  if (context === undefined) {
    throw new Error("usePreloader must be used within a PreloaderProvider");
  }
  return context;
}
