import { Notebook } from '@jupyterlab/notebook';
import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import { FileManager } from './FileManager';
import { JupyterListener, NotebookProvenance } from './JupyterListener';

// Loops State MetaData Property Key
export const LoopsState = 'loops-state';
// Loops State MetaData Type for Property Value
export type LoopsStateTypeValue = 'out-of-order' | 'first-state' | undefined;
export type LoopsStateType = {
  [LoopsState]: LoopsStateTypeValue[];
};

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
      const stateType: LoopsStateTypeValue[] = [];

      const state = this.trrack.getState();
      const prevIndex = state.activeCellIndex;
      const newIndex = prov.activeCellIndex;
      const outOfOrder = prevIndex > newIndex;
      console.log('prevIndex', prevIndex, 'newIndex', newIndex);

      if (outOfOrder) {
        stateType.push('out-of-order');
      }

      if (prevIndex === -1) {
        stateType.push('first-state');
      }

      this.trrack.apply(event, this.setNotebookState(prov));
      this.addMetaData(stateType);
    }
  }

  public addMetaData(stateType: LoopsStateTypeValue[]) {
    const stateMetaData: LoopsStateType = {
      [LoopsState]: stateType
    };
    this.trrack.metadata.add(stateMetaData);
  }

  public saveProv() {
    this.fileManager.writeToFile(this.trrack.export());
  }

  private async importProv() {
    console.time('import provenance');
    const provString = await this.fileManager.loadFromFile();
    if (provString) {
      this.trrack.import(provString);
    } else {
      console.log('no provenance available');
    }
    console.timeEnd('import provenance');
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
