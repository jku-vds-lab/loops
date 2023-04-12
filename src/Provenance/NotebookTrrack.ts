import { INotebookModel, Notebook } from '@jupyterlab/notebook';
import { Registry, initializeTrrack } from '@trrack/core';
import { JupyterListener } from './JupyterListener';

// State based provenance tracking
// State == Current Notebook JSON
export class NotebookTrrack {
  public trrack;
  public setNotebookState;
  public enabled = true;

  constructor(public notebook: Notebook) {
    const registry = Registry.create(); // TODO: one registry per notebook?

    this.setNotebookState = registry.register('setNotebookState', (state, notebook: Notebook) => {
      state.notebookModel = notebook.model;
      state.activeCell = notebook.activeCellIndex;
    });

    const initialState: TrrackState = {
      notebookModel: null,
      activeCell: 0
    };

    // create initial state
    if (!notebook.model?.metadata.has('provenance')) {
      initialState.notebookModel = notebook.model;
      initialState.activeCell = notebook.activeCellIndex;
    }

    this.trrack = initializeTrrack({ initialState, registry });
    new JupyterListener(this, this.notebook);
  }

  public apply(event: EventType, notebook: Notebook): void {
    if (this.enabled) {
      this.trrack.apply(event, this.setNotebookState(notebook));
    }
  }
}

/**
 * Initial state
 */
export type TrrackState = {
  notebookModel: INotebookModel | null;
  activeCell: number;
};

// function exportModel(notebook: Notebook): INBCell[] {
//   const cells = [];
//   if (notebook.model?.cells) {
//     for (let i = 0; i < notebook.model?.cells.length; i++) {
//       const cell = exportCell(notebook, i);
//       if (cell) {
//         cells.push(cell);
//       }
//     }
//   }
//   return cells;
// }

// function exportCell(notebook: Notebook, index: number): INBCell | null {
//   const cell = notebook.model?.cells.get(index);
//   if (cell) {
//     const exportedCell = cell.toJSON();
//     // add id to cell json data to allow tracking
//     exportedCell.id = cell.id;
//     // an empty execution count is exported as an empty object, which the import function complains about
//     if (typeof exportedCell.execution_count === 'object') {
//       exportedCell.execution_count = null;
//     }
//     return exportedCell as INBCell;
//   }
//   return null;
// }

/**
 * EventType Enum covering all events that can happen in a notebook
 */
// export enum EventType {
//   activeCell = 'ChangeActiveCell', // TODO stop tracking active cell changes or make it configurable
//   changeCell = 'ChangeCellContent',
//   executeCell = 'ExecuteCell',
//   addCell = 'add',
//   removeCell = 'remove',
//   moveCell = 'move',
//   setCell = 'set'
// }

export type EventType = 'add' | 'remove' | 'move' | 'set';
