import { IObservableList, IObservableUndoableList } from '@jupyterlab/observables';
import { NotebookTrrack } from './NotebookTrrack';
import { ICellModel } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';

export class JupyterListener {
  constructor(private nbtrrack: NotebookTrrack, private notebook: Notebook) {
    const trackCellChanges = this.trackCellChanges();
    console.log('JupyterListener trackCellChanges', trackCellChanges);
  }

  trackCellChanges(): boolean {
    return this.notebook.model?.cells.changed.connect(this.cellChanged, this) || false;
  }

  private cellChanged(list: IObservableList<ICellModel>, change: IObservableList.IChangedArgs<ICellModel>) {
    // list properties:
    // *  _cellMap
    //    list._cellMap._map.forEach((value, key) => console.log(key, value))
    // * _cellOrder: array with ids

    this.nbtrrack.apply(change.type, this.notebook);
  }
}
