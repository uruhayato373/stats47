import { type ReactNode } from "react";

import { create } from "zustand";

interface SidebarSectionState {
  section: ReactNode | null;
  setSection: (section: ReactNode | null) => void;
}

export const useSidebarSectionStore = create<SidebarSectionState>((set) => ({
  section: null,
  setSection: (section) => set({ section }),
}));
