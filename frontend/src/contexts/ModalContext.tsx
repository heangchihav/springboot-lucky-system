"use client";

import { createContext, useContext, ReactNode, useState } from "react";

type ModalContextType = {
  showEditModal: boolean;
  editingAssignment: any;
  showProfileModal: boolean;
  selectedAssignment: any;
  openEditModal: (assignment: any) => void;
  closeEditModal: () => void;
  openProfileModal: (assignment: any) => void;
  closeProfileModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const openEditModal = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAssignment(null);
  };

  const openProfileModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedAssignment(null);
  };

  return (
    <ModalContext.Provider
      value={{
        showEditModal,
        editingAssignment,
        showProfileModal,
        selectedAssignment,
        openEditModal,
        closeEditModal,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
