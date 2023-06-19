import { create } from 'zustand';

type LoopsState = {
  activeCellID: string | undefined;
  setActiveCell: (cellID: string | undefined) => void;
  clearActiveCell: () => void;
};

export const useLoopStore = create<LoopsState>(set => ({
  activeCellID: undefined,
  setActiveCell: cellID => set(state => ({ activeCellID: cellID })),
  clearActiveCell: () => set({ activeCellID: undefined })
}));
