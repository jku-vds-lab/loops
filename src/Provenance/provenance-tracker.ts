import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import {
  IApplicationState,
  EventType,
  NotebookProvenance
} from './notebook-provenance';
import { ICellModel, Cell } from '@jupyterlab/cells';
import { IObservableList } from '@jupyterlab/observables';
import { NotebookUtil } from './notebook-util';
import {
  ActionFunction,
  ActionObject,
  ActionType,
  createAction
} from '@visdesignlab/trrack';
import { toArray } from '@lumino/algorithm';

export class NotebookProvenanceTracker {
  // stores cell value changes
  private cellValueChange: { cellIndex: number; value: string } | null = null;

  private activeCellChangedListener: any;

  private renderCounter = 0;

  constructor(private notebookProvenance: NotebookProvenance) {
    // register all listeners
    this.trackActiveCell();
    this.trackCellsChanged();
    this.trackCellExecution();

    this.registerCellListeners();

    this.registerRenderListeners();
  }

  /**
   * Register listeners to track the state of rendering of the notebook cells
   * This is a workaround to "placeholder cells" changing the active cell index
   */
  registerRenderListeners(): void {
    this.notebookProvenance.notebook.fullyRendered.connect(
      (notebook, fullyRendered) => {
        if (!fullyRendered) {
          // if fullyRendered is false stop tracking and increase the counter
          if (this.renderCounter === 0) {
            this.stopTrackActiveCell();
          }
          this.renderCounter++;
        }
      }
    );
    this.notebookProvenance.notebook.placeholderCellRendered.connect(
      (notebook, placeholderCellRendered) => {
        // if a placeholder cell is rendered decrease the counter
        this.renderCounter--;
        if (this.renderCounter === 0) {
          // if the render counter is zero again -> start tracking again
          this.notebookProvenance.notebook.activeCellIndex =
            this.notebookProvenance.prov.state.activeCell;
          this.trackActiveCell();
        }
      }
    );
  }

  /**
   * Register a listener on cell content change
   */
  trackCellContentChanged(cell: ICellModel): void {
    cell.contentChanged.connect(cell => {
      if (
        this.notebookProvenance.pauseTracking ||
        !this.notebookProvenance.notebook.model
      ) {
        return;
      }

      const index = NotebookUtil.getCellIndex(
        this.notebookProvenance.notebook,
        cell
      );

      // check if there is already pending changes to the current cell or others
      if (index >= 0) {
        if (this.cellValueChange) {
          if (index === this.cellValueChange.cellIndex) {
            this.cellValueChange.value = cell.value.text;
          } else {
            this.applyCellValueChange();
          }
        } else {
          this.cellValueChange = { cellIndex: index, value: cell.value.text };
        }
      }
    }, this);
  }

  /**
   * Register cell content change listeners on all cells in the notebook at the moment
   */
  registerCellListeners(): void {
    toArray(this.notebookProvenance.notebook.model!.cells.iter()).forEach(
      cell => this.trackCellContentChanged(cell)
    );
  }

  /**
   * Apply the changeCellValueAction if there are any changes
   */
  applyCellValueChange(): void {
    if (
      this.cellValueChange &&
      this.notebookProvenance.prov.state.model.cells[
        this.cellValueChange.cellIndex
      ].source !== this.cellValueChange.value
    ) {
      this.applyAction(
        this.changeCellValueAction(
          this.cellValueChange.cellIndex,
          this.cellValueChange.value
        )
      );
    }
    this.cellValueChange = null;
  }

  /**
   * Handle a change of the active cell
   */
  trackActiveCell(): void {
    this.activeCellChangedListener = (notebook: Notebook) => {
      if (this.notebookProvenance.pauseTracking) {
        return;
      }
      // make sure the cellIndex actually changed
      // the activeCell is set to activeCellIndex-1 before a cell is removed, dont track that
      if (
        this.notebookProvenance.prov.state.activeCell ===
          notebook.activeCellIndex ||
        notebook.model!.cells.length <
          this.notebookProvenance.prov.state.model.cells.length
      ) {
        return;
      }

      // Track if cell value has been changed before adding e.g. adding a new cell
      this.applyCellValueChange();

      this.applyAction(this.activeCellAction(notebook.activeCellIndex));
    };

    this.notebookProvenance.notebook.activeCellChanged.connect(
      this.activeCellChangedListener,
      this
    );
  }

  /**
   * Stop tracking active cell changes
   */
  stopTrackActiveCell(): void {
    this.notebookProvenance.notebook.activeCellChanged.disconnect(
      this.activeCellChangedListener,
      this
    );
  }

  /**
   * Handle a cell execution
   */
  trackCellExecution(): void {
    NotebookActions.executed.connect(
      (_dummy, obj: { notebook: Notebook; cell: Cell }) => {
        if (this.notebookProvenance.pauseTracking) {
          return;
        }

        // Track if cell value has been changed before adding e.g. adding a new cell
        this.applyCellValueChange();

        const index = NotebookUtil.getCellIndex(obj.notebook, obj.cell.model);

        this.applyAction(this.executeCellAction(index, obj.notebook));
      },
      this
    );
  }

  /**
   * Handle a change in the cells list
   */
  trackCellsChanged(): void {
    const cellsChangedListener = (
      list: IObservableList<ICellModel>,
      change: IObservableList.IChangedArgs<ICellModel>
    ) => {
      if (this.notebookProvenance.pauseTracking) {
        return;
      }

      const notebook = this.notebookProvenance.notebook;

      if (!notebook.model) {
        return;
      }

      // Track if cell value has been changed before adding e.g. adding a new cell
      this.applyCellValueChange();

      switch (change.type) {
        case 'add':
          this.applyAction(this.addCellAction(change.newIndex, notebook));
          this.trackCellContentChanged(change.newValues[0]);
          break;
        case 'remove':
          this.applyAction(this.removeCellAction(change.oldIndex, notebook));
          break;
        case 'move':
          this.applyAction(
            this.moveCellAction(change.newIndex, change.oldIndex, notebook)
          );
          break;
        case 'set':
          this.applyAction(this.setCellAction(change.newIndex, notebook));
          this.trackCellContentChanged(change.newValues[0]);
          break;
        default:
          return;
      }
    };

    this.notebookProvenance.notebook.model!.cells.changed.connect(
      cellsChangedListener,
      this
    );
  }

  /**
   * Create action and set actionFunction and properties
   * @param actionFunc The function that updates the state
   * @param eventType Type of the action
   * @param setActionProperties Callback to set properties of action when it is added
   * @param actionType Regular or Ephemeral action
   * @returns A callback that returns the actionObject
   */
  setupAction<Args extends unknown[] = unknown[]>(
    actionFunc: ActionFunction<IApplicationState, Args>,
    eventType: EventType,
    setActionProperties: (
      actionObject: ActionObject<IApplicationState, EventType, Args>,
      ...args: Args
    ) => ActionObject<IApplicationState, EventType, Args>,
    actionType: ActionType = 'Regular'
  ): (...args: Args) => ActionObject<IApplicationState, EventType, Args> {
    const action = createAction<IApplicationState, Args, EventType>(actionFunc)
      .setEventType(eventType)
      .setActionType(actionType);

    // @ts-ignore
    return (...args: Args) => {
      return setActionProperties(action, ...args).call(this, ...args);
    };
  }

  /**
   * Apply an action to the provenance graph
   * @param actionObject The action to apply
   */
  applyAction(
    actionObject: ActionObject<IApplicationState, EventType, any>
  ): void {
    this.notebookProvenance.pauseObserverExecution = true;
    this.notebookProvenance.prov.apply(actionObject);
    this.notebookProvenance.pauseObserverExecution = false;
  }

  /**
   * Change cell content
   * @param index
   * @param value
   */
  changeCellValueAction = this.setupAction<[number, string]>(
    (state, index, value) => {
      state.model.cells[index].source = value;
      return state;
    },
    EventType.changeCellValue,
    (action, index, value) =>
      action
        .setLabel('Cell value: ' + value)
        .setMetaData({ changedCellId: index })
  );

  /**
   * Change active cell
   * @param index
   */
  activeCellAction = this.setupAction<[number]>(
    (state, index) => {
      state.activeCell = index;
      return state;
    },
    EventType.activeCell,
    (action, index) =>
      action
        .setLabel('Active cell: ' + index)
        .setMetaData({ changedCellId: index }),
    'Ephemeral'
  );

  /**
   * Execute a cell
   * @param index
   * @param notebook
   */
  executeCellAction = this.setupAction<[number, Notebook]>(
    (state, index, notebook) => {
      state.model.cells[index] = NotebookUtil.exportCell(notebook, index)!;
      return state;
    },
    EventType.executeCell,
    (action, index) =>
      action.setLabel('Cell executed').setMetaData({ changedCellId: index })
  );

  /**
   * Add a new cell
   * @param index
   * @param notebook
   */
  addCellAction = this.setupAction<[number, Notebook]>(
    (state, index, notebook) => {
      state.model.cells.splice(
        index,
        0,
        NotebookUtil.exportCell(notebook, index)!
      );
      state.activeCell = index;
      return state;
    },
    EventType.addCell,
    (action, index, notebook) =>
      action.setLabel('Cell added').setMetaData({
        changedCellId: index,
        cellPositions: new Array<number>(notebook.model!.cells.length - 1)
          .fill(0)
          .map((v, i) => (i < index ? i : i + 1))
      })
  );

  /**
   * Remove a cell
   * @param index
   * @param notebook
   */
  removeCellAction = this.setupAction<[number, Notebook]>(
    (state, index, notebook) => {
      state.model.cells.splice(index, 1);
      const newIndex = Math.min(index, state.model.cells.length - 1);
      if (state.activeCell !== newIndex) {
        state.activeCell = newIndex;
      }
      return state;
    },
    EventType.removeCell,
    (action, index, notebook) => {
      const cellPos = new Array<number>(notebook.model!.cells.length)
        .fill(0)
        .map((v, i) => i);
      cellPos.splice(index, 0, -1);
      return action
        .setLabel('Cell removed')
        .setMetaData({ changedCellId: -1, cellPositions: cellPos });
    }
  );

  /**
   * Move a cell
   * @param newIndex
   * @param oldIndex
   * @param notebook
   */
  moveCellAction = this.setupAction<[number, number, Notebook]>(
    (state, newIndex, oldIndex, notebook) => {
      state.model.cells.splice(
        newIndex,
        0,
        state.model.cells.splice(oldIndex, 1)[0]
      );
      state.activeCell = newIndex;
      return state;
    },
    EventType.moveCell,
    (action, newIndex, oldIndex, notebook) => {
      const cellPos = new Array<number>(notebook.model!.cells.length)
        .fill(0)
        .map((v, i) => i);
      cellPos.splice(newIndex, 0, cellPos.splice(oldIndex, 1)[0]);
      return action
        .setLabel('Cell moved')
        .setMetaData({ changedCellId: newIndex, cellPositions: cellPos });
    }
  );

  /**
   * Change cell type
   * @param index
   * @param notebook
   */
  setCellAction = this.setupAction<[number, Notebook]>(
    (state, index, notebook) => {
      state.model.cells[index] = NotebookUtil.exportCell(notebook, index)!;
      return state;
    },
    EventType.setCell,
    (action, index, notebook) =>
      action.setLabel('Cell type changed').setMetaData({ changedCellId: index })
  );
}
