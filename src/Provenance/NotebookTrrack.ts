import { Notebook } from '@jupyterlab/notebook';
import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import { FileManager } from './FileManager';
import { JupyterListener, NotebookProvenance } from './JupyterListener';
import { User } from '@jupyterlab/services';

// Loops State MetaData Property Key
export const LoopsStateMetaDataKey = 'loops-state';
// Loops State MetaData Type for Property Value
export type LoopsStateMetaDataValue = 'out-of-order' | 'first-state' | undefined;
export type LoopsStateMetaDataType = {
  [LoopsStateMetaDataKey]: LoopsStateMetaDataValue[];
};

// Loops State MetaData Property Key
export const LoopsActiveCellMetaDataKey = 'loops-executed-cell-id';
// Loops State MetaData Type for Property Value
export type LoopsActiveCellMetaDataValue = string | undefined;
export type LoopsActiveCellMetaDataType = {
  [LoopsActiveCellMetaDataKey]: LoopsActiveCellMetaDataValue;
};

// Loops State MetaData Property Key
export const LoopsUserMetaDataKey = 'loops-executing-user';
// Loops State MetaData Type for Property Value
export type LoopsUserMetaDataValue = object | undefined;
export type LoopsUserMetaDataType = {
  [LoopsUserMetaDataKey]: LoopsUserMetaDataValue;
};

// State based provenance tracking
// State == Current Notebook Content
export class NotebookTrrack {
  public trrack: Trrack<NotebookProvenance, string>;
  public setNotebookState;
  public enabled = true;

  constructor(public notebook: Notebook, private fileManager: FileManager, private user?: User.IIdentity) {
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
      const stateType: LoopsStateMetaDataValue[] = [];

      const state = this.trrack.getState();
      const prevIndex = state.activeCellIndex;
      const newIndex = prov.activeCellIndex;
      const outOfOrder = prevIndex > newIndex;

      if (outOfOrder) {
        stateType.push('out-of-order');
      }

      if (prevIndex === -1) {
        stateType.push('first-state');
      }

      this.trrack.apply(event, this.setNotebookState(prov));
      this.addStateMetaData(stateType);

      this.addActiveCellMetaData(prov.activeCellID);

      this.addUserMetaData(this.user);
    }
  }

  public addUserMetaData(userData: LoopsUserMetaDataValue) {
    const userMetaData: LoopsUserMetaDataType = {
      [LoopsUserMetaDataKey]: userData
    };
    this.trrack.metadata.add(userMetaData);
  }

  public addActiveCellMetaData(activeCellId: LoopsActiveCellMetaDataValue) {
    const activeCellMetaData: LoopsActiveCellMetaDataType = {
      [LoopsActiveCellMetaDataKey]: activeCellId
    };
    this.trrack.metadata.add(activeCellMetaData);
  }

  public addStateMetaData(stateType: LoopsStateMetaDataValue[]) {
    const stateMetaData: LoopsStateMetaDataType = {
      [LoopsStateMetaDataKey]: stateType
    };
    this.trrack.metadata.add(stateMetaData);
  }

  public saveProv() {
    this.fileManager.writeToFile(this.trrack.export());
  }

  private async importProv() {
    const timerName = `import provenance ${this.notebook.title.label}`;
    console.time(timerName);
    const provString = await this.fileManager.loadFromFile();
    if (provString) {
      this.trrack.import(provString);
    } else {
      console.log('no provenance available');
    }
    console.timeEnd(timerName);
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
