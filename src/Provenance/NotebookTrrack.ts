import { Notebook } from '@jupyterlab/notebook';
import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import { JupyterListener, NotebookProvenance } from './JupyterListener';
import { FileManager } from './FileManager';
import { IconOctagon } from '@tabler/icons-react';

// State based provenance tracking
// State == Current Notebook Content
export class NotebookTrrack {
  public trrack: Trrack<NotebookProvenance, string>;
  public setNotebookState;
  public enabled = true;

  constructor(public notebook: Notebook, private fileManager: FileManager) {
    const registry = Registry.create(); // TODO registry can be created once for all notebooks

    this.setNotebookState = registry.register('setNotebookState', (state, prov: NotebookProvenance) => {
      state.cells = prov.cells;
      state.activeCellIndex = prov.activeCellIndex;
      // force trrack to create diffs --> save space in storage
      // add top level dummy keys (more than 50% of the keys) that stay constant
      // this will create states of type 'patch' instead of 'checkpoint'
      state.dummy1 = true;
      state.dummy2 = true;
      state.dummy3 = true;
      // 3 of 5 keys are constant now
    });

    const initialState: NotebookProvenance = {
      cells: [],
      activeCellIndex: -1
    };

    this.trrack = initializeTrrack({ initialState, registry });
    this.importProv();
    new JupyterListener(this, this.notebook);
  }

  public apply(event: EventType, prov: NotebookProvenance): void {
    if (this.enabled) {
      this.trrack.apply(event, this.setNotebookState(prov));
      this.fileManager.writeToFile(this.trrack.export());
    }
  }

  private async importProv() {
    const provString = await this.fileManager.loadFromFile();
    if (provString) {
      this.trrack.import(provString);
    } else {
      console.log('no provenance available');
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
