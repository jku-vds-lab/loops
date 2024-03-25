import { create } from 'zustand';

type LoopsState = {
  activeCellID: string | undefined;
  activeCellTop: number | undefined;
  stateData: Map<number, { date: Date; cellExecutions: number; isVisible: boolean }>;

  setActiveCell: (cellID: string | undefined, cellTop: number | undefined) => void;
  clearActiveCell: () => void;
  clearStateData: () => void;
};

export const useLoopsStore = create<LoopsState>(set => ({
  activeCellID: undefined,
  activeCellTop: undefined,
  stateData: new Map(),

  setActiveCell: (cellID, cellTop) => set(state => ({ activeCellID: cellID, activeCellTop: cellTop })),
  clearActiveCell: () => set({ activeCellID: undefined, activeCellTop: undefined }),
  clearStateData: () => set({ stateData: new Map() })
}));
