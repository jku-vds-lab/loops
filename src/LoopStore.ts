import { create } from 'zustand';

type LoopsState = {
  activeCell: number | null;
  setActiveCell: (index: number) => void;
  clearActiveCell: () => void;
};

export const useLoopStore = create<LoopsState>(set => ({
  activeCell: null,
  setActiveCell: index => set(state => ({ activeCell: index })),
  clearActiveCell: () => set({ activeCell: null })
}));
