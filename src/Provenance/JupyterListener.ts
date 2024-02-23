import { Cell, CodeCell, ICellModel, MarkdownCell, RawCell } from '@jupyterlab/cells';
import { CellType, IAttachments, ICell, IOutput } from '@jupyterlab/nbformat';
import { CellList, KernelError, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { IObservableList } from '@jupyterlab/observables';
import { toArray } from '@lumino/algorithm';
import { useLoopsStore } from '../LoopsStore';
import { NotebookTrrack } from './NotebookTrrack';

export class JupyterListener {
  private serializer = new XMLSerializer();
  constructor(private nbtrrack: NotebookTrrack, private notebook: Notebook) {
    const trackCellChanges = this.trackCellChanges();
    console.debug(notebook.title.label, 'JupyterListener trackCellChanges enabled?', trackCellChanges);

    // listener for changes of the active cell
    this.notebook.activeCellChanged.connect((notebook, args) => {
      // console.log('JupyterListener activeCellChanged', notebook, args);

      // const widgetID = notebook.activeCell?.id; // ID of the lumino widget - not needed (and typically empty)
      if (notebook.activeCell) {
        const cellID = notebook.activeCell.model.id; // ID of the cell model - needed to identify the cell
        useLoopsStore.getState().setActiveCell(cellID, notebook.activeCell.node.getBoundingClientRect().top);
      }
    });

    // this.notebook.selectionChanged.connect((notebook, args) => {
    //   console.log('JupyterListener selectionChanged', notebook, args);
    // });

    const trackExecutions = this.trackExecutions();
    console.debug(notebook.title.label, 'JupyterListener trackExecutions enabled?', trackExecutions);

    // fires likes 6 times when a cell is executed 😵‍💫
    // this.notebook.modelContentChanged.connect((notebookModel, args) => {
    //   console.log('modelContentChanged', notebookModel, args);
    // });

    this.notebook.modelChanged.connect((oldModel, newModel) => {
      console.log(notebook.title.label, '⚠️⚠️⚠️ JupyterListener modelChanged', oldModel, newModel);
    });

    if (notebook.activeCell) {
      const cellID = notebook.activeCell.model.id; // ID of the cell model - needed to identify the cell
      useLoopsStore.getState().setActiveCell(cellID, notebook.activeCell.node.getBoundingClientRect().top);
    }
  }

  trackCellChanges(): boolean {
    return this.notebook.model?.cells.changed.connect(this.cellChanged, this) || false;
  }

  /**
   * Listener for changes of a notebook's cells.
   * Registered for a specific notebook, i.e., will only be called for changes on that notebook.
   * @param list
   * @param change
   */
  private cellChanged(list: CellList, change: IObservableList.IChangedArgs<ICellModel>) {
    console.log('JupyterListener cellChanged', list);

    // change types: add, remove, move, and set (changing type of cell (code, markdown, raw))
    // this.nbtrrack.apply(change.type, this.notebook);
  }

  trackExecutions(): boolean {
    // NotebookActions.executionScheduled.connect((sender, { cell, notebook }) => {
    //   console.log('JupyterListener executionScheduled - Active Cell', notebook.activeCellIndex);
    // });

    return NotebookActions.executed.connect(this.cellExecuted, this);
  }

  /**
   * Listener for executes. Registered globally, i.e., any cell in any notebook.
   * @param sender
   * @param args
   */
  private cellExecuted(
    sender,
    args: { notebook: Notebook; cell: Cell<ICellModel>; success: boolean; error?: KernelError | null | undefined }
  ) {
    const { cell, notebook /*, success, error */ } = args; // not using success and error currently
    //check if it is the notebook tracked by this instance
    if (notebook.id === this.notebook.id) {
      console.log('JupyterListener cellExecuted', notebook);
      notebook.model?.cells.get(0);

      // console.log('notebook active cell id', notebook.activeCell?.id, notebook.activeCell?.model.id);
      const prov: NotebookProvenance = {
        cells: [],
        // set active cell stored in notebook as fallback.
        // Correc if "Execute and don't Advance" (Ctrl+Enter) was used
        // when  "Execute and Advance" (Shift+Enter / Toolbar button) was used, the index is already updated to the next cell when this listener is executed
        // therefore this index will be overwritten by getting the index of the executed cell (part of args) below
        activeCellIndex: notebook.activeCellIndex,
        activeCellID: notebook.activeCell?.id
        // active cell also does not have to be the executed cell, e.g. when "Run All" or "Run All Above Selected Cell" is used
      };
      // console.log('JupyterListener cellExecuted - Active Cell', notebook.activeCellIndex);

      const childs = toArray(notebook.children());
      for (const [index, child] of childs.entries()) {
        if (child instanceof Cell && child.inputArea) {
          const input = child.inputArea;

          // console.log(child.id, 'input', input);
          // const dataset = child.dataset; // was empty thus far
          //const children = toArray(child.children()); // all HTML elements that belong to a cell (header, footer, toolbar, input, output)
          // --> input and output can be accessed separately
          const inputModel = child.inputArea.model;

          // get just the editor
          const inputHTML = input.node.querySelector('.jp-InputArea-editor')?.cloneNode(true) as HTMLElement;
          // remove all unneeded CodeMirror elements (e.g. line numbers, cursor, ...)
          inputHTML.querySelectorAll('.CodeMirror>:not(.CodeMirror-scroll)')?.forEach(node => node.remove());
          inputHTML.querySelectorAll('.cm-cursorLayer')?.forEach(node => node.remove());
          inputHTML.querySelectorAll('.cm-selectionLayer')?.forEach(node => node.remove());

          // remove cursor, selection, highlights, etc.
          const hits = inputHTML.querySelectorAll(
            '.jp-mod-completer-enabled, .jp-mod-focused, .cm-focused, .jp-mod-has-primary-selection'
          );
          hits?.forEach(node =>
            node.classList.remove(
              'jp-mod-completer-enabled',
              'jp-mod-focused',
              'cm-focused',
              'jp-mod-has-primary-selection'
            )
          );

          let cellProv: CellProvenance = {
            id: child.inputArea.model.id, // same as child.model.id
            type: inputModel.type,
            inputModel: inputModel.toJSON(),
            inputHTML: this.serializer.serializeToString(inputHTML),
            outputHTML: Array.from(child.node.querySelectorAll('.jp-OutputArea-output')).map(node =>
              this.serializer.serializeToString(node.cloneNode(true))
            ),
            active: cell === child
          };
          if (cellProv.active) {
            prov.activeCellIndex = index;
            prov.activeCellID = cellProv.id;
            // console.log('JupyterListener cellExecuted - Executed Cell', index);
          }

          if (child instanceof CodeCell) {
            //CodeCell extends cell
            const outputArea = child.outputArea; //all outputs
            // inidividual outputs are stored as children
            // no output (e.g. imports) --> empty children array
            // cells can have multiple outputs (e.g. print(), last cell line output, visualization)
            //const outputs = toArray(outputArea.children());
            // widgets actually gives the same data more easily:
            // const widgets = outputArea.widgets;
            // console.log('output widgets', widgets);
            // console.log('code cell was executee #', child.model.executionCount);

            // // widgets == representation, model == data
            // for (let i = 0; i < outputArea.model.length; i++) {
            //   const output: IOutputModel = outputArea.model.get(i);
            //   const type = output.type as OutputType;
            //   // types:
            //   // * stream:  prints or streaming outputs (there can be multiple stream outputs, e.g., for stdout and stderr)
            //   // * execute_result: last line of cell
            //   // * display_data:  seaborn/matplotlib
            //   // * update_display_data: update a display_data output
            //   // * error: errors during code execution
            //   // also see: https://jupyter-client.readthedocs.io/en/stable/messaging.html#execution-errors

            //   const data = output.data;
            //   // data:
            //   // * text/plain: print() output
            //   // * text/html: e.g., pandas dataframes
            //   // * image/png: e.g., seaborn/matplotlib
            //   // * image/jpeg
            //   // * image/svg+xml
            //   // * application/vnd.jupyter.stderr: print to stderr  (e.g. warnings)
            //   // * application/vnd.jupyter.stdout: print to stdout

            //   //executionCount is shown for input and output (but only for 'execute_result' type)
            //   console.log('output', i, output.executionCount, type, Object.keys(output.data));
            // }

            // const model = notebook.model;
            // const cell3 = model?.cells.get(3);
            // console.log('cell type', cell3?.type, 'val', cell3?.sharedModel.getSource());
            // console.log('cell', cell3);

            cellProv = { ...cellProv, output: outputArea.model.toJSON() } as CodeCellProvenance;
          } else if (child instanceof MarkdownCell) {
            //MarkdownCell extends attachmentcell which extends cell
            // console.log('markdown headlines', child.headingInfo);
            //console.log('markdown headlines', child.headings); // requires jupyter 4

            // output == rendered Markdown
            // .jp-RenderedHTMLCommo
            const outputHTML = Array.from(child.node.querySelectorAll('.jp-MarkdownOutput')).map(node =>
              this.serializer.serializeToString(node.cloneNode(true))
            );

            // copy/pasted images, for example, are attachments
            const attachments = child.model.attachments;
            // console.log('attachments', attachments.keys);

            // const attachmentData = attachments.get(attachments.keys[0]);
            cellProv = { ...cellProv, attachments: attachments.toJSON(), outputHTML } as MarkdownCellProvenance;
          } else if (child instanceof RawCell) {
            //RawCell extends cell
            // no special information
            // console.log('raw');
          } else {
            // console.log('unknown cell');
          }
          prov.cells.push(cellProv);
        }
      }

      this.nbtrrack.apply('execute', prov);
    } else {
      // listener is still active while the notebook is open (removed when notebook closed)
      console.debug(
        'Waiting for executions of this notebook:',
        this.notebook.title.label,
        this.notebook.id,
        '. Executed notebook:',
        notebook.title.label,
        notebook.id
      );
    }
  }
}

export type CellProvenance = {
  id: string;
  type: CellType;
  inputModel: ICell;
  inputHTML?: string;
  outputHTML: string[];
  active: boolean;
};

export type CodeCellProvenance = CellProvenance & { type: 'code'; output: IOutput[] };
export type MarkdownCellProvenance = CellProvenance & { type: 'markdown'; attachments: IAttachments };

export function isCodeCellProvenance(cell: CellProvenance): cell is CodeCellProvenance {
  return cell.type === 'code';
}

export function isMarkdownCellProvenance(cell: CellProvenance): cell is MarkdownCellProvenance {
  return cell.type === 'markdown';
}

export type NotebookProvenance = {
  cells: CellProvenance[];
  activeCellIndex: number;
  activeCellID?: string;
};
