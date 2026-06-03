import React, { createContext, useContext, useState, ReactNode } from "react";

interface ModalContextType {
  isAddOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  return (
    <ModalContext.Provider
      value={{
        isAddOpen,
        openAdd: () => setIsAddOpen(true),
        closeAdd: () => setIsAddOpen(false),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
