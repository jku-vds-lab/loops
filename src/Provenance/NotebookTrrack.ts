import { Notebook } from '@jupyterlab/notebook';
import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import { JupyterListener, NotebookProvenance } from './JupyterListener';

// State based provenance tracking
// State == Current Notebook Content
export class NotebookTrrack {
  public trrack: Trrack<NotebookProvenance, string>;
  public setNotebookState;
  public enabled = true;

  constructor(public notebook: Notebook) {
    const registry = Registry.create(); // TODO registry can be created once for all notebooks

    this.setNotebookState = registry.register('setNotebookState', (state, prov: NotebookProvenance) => {
      state.cells = prov.cells;
      state.activeCellIndex = prov.activeCellIndex;
      // TODO: force trrack to create diffs
      // e.g., on major changes
      // add top level dummy keys (more than 50% of the keys) that stay constant
    });

    const initialState: NotebookProvenance = { cells: [], activeCellIndex: -1 };

    this.trrack = initializeTrrack({ initialState, registry });
    new JupyterListener(this, this.notebook);
  }

  public apply(event: EventType, prov: NotebookProvenance): void {
    if (this.enabled) {
      this.trrack.apply(event, this.setNotebookState(prov));
    }
  }
}

/**
 * EventType Enum covering all events that can happen in a notebook
 */
// export enum EventType {
//   activeCell = 'ChangeActiveCell',
//   changeCell = 'ChangeCellContent',
//   executeCell = 'ExecuteCell',
//   addCell = 'add',
//   removeCell = 'remove',
//   moveCell = 'move',
//   setCell = 'set'
// }

export type EventType = 'add' | 'remove' | 'move' | 'set' | 'execute';
