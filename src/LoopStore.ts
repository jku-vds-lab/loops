import { create } from 'zustand';

type LoopsState = {
  activeCellID: string | undefined;
  activeCellTop: number | undefined;

  setActiveCell: (cellID: string | undefined, cellTop: number | undefined) => void;
  clearActiveCell: () => void;
};

export const useLoopStore = create<LoopsState>(set => ({
  activeCellID: undefined,
  activeCellTop: undefined,

  setActiveCell: (cellID, cellTop) => set(state => ({ activeCellID: cellID, activeCellTop: cellTop })),
  clearActiveCell: () => set({ activeCellID: undefined, activeCellTop: undefined })
}));
