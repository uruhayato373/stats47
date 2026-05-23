import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // D 案: デフォルト閉じる (デスクトップ最適化、コンテンツ集中)。
  // 必要なときは Header の hamburger ボタンで開閉できる。
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
