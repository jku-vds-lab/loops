import { Cell, CodeCell, ICellModel, MarkdownCell, RawCell } from '@jupyterlab/cells';
import { CellType, IAttachments, ICell, IOutput, OutputType } from '@jupyterlab/nbformat';
import { KernelError, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { IObservableList } from '@jupyterlab/observables';
import { IOutputModel } from '@jupyterlab/rendermime';
import { toArray } from '@lumino/algorithm';
import { NotebookTrrack } from './NotebookTrrack';

export class JupyterListener {
  constructor(private nbtrrack: NotebookTrrack, private notebook: Notebook) {
    const trackCellChanges = this.trackCellChanges();
    console.log('JupyterListener trackCellChanges', trackCellChanges);

    const trackExecutions = this.trackExecutions();
    console.log('JupyterListener trackExecutions', trackExecutions);

    // fires likes 6 times when a cell is executed 😵‍💫
    // this.notebook.modelContentChanged.connect((notebookModel, args) => {
    //   console.log('modelContentChanged', notebookModel, args);
    // });

    this.notebook.modelChanged.connect((oldModel, newModel) => {
      console.log('⚠️⚠️⚠️ modelChanged', oldModel, newModel);
    });
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
  private cellChanged(list: IObservableList<ICellModel>, change: IObservableList.IChangedArgs<ICellModel>) {
    console.log('cellChanged', list);

    // change types: add, remove, move, and set (changing type of cell (code, markdown, raw))
    // this.nbtrrack.apply(change.type, this.notebook);
  }

  trackExecutions(): boolean {
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
    const { cell, notebook, success, error } = args;
    console.log('cellExecuted', notebook);
    notebook.model?.cells.get(0);

    const prov: NotebookProvenance = {
      cells: []
    };

    const childs = toArray(notebook.children());
    for (const child of childs) {
      if (child instanceof Cell) {
        const input = child.inputArea;

        console.log(child.id, 'input', input);
        // const dataset = child.dataset; // was empty thus far
        //const children = toArray(child.children()); // all HTML elements that belong to a cell (header, footer, toolbar, input, output)
        // --> input and output can be accessed separately
        const inputModel = child.inputArea.model;
        let cellProv: CellProvenance = {
          id: child.inputArea.model.id,
          type: inputModel.type,
          input: inputModel.toJSON(),
          active: notebook.activeCell === child
        };

        if (child instanceof CodeCell) {
          //CodeCell extends cell
          const outputArea = child.outputArea; //all outputs
          // inidividual outputs are stored as children
          // no output (e.g. imports) --> empty children array
          // cells can have multiple outputs (e.g. print(), last cell line output, visualization)
          //const outputs = toArray(outputArea.children());
          // widgets actually gives the same data more easily:
          const widgets = outputArea.widgets;
          console.log('output widgets', widgets);
          // widgets.forEach(w => w.node.cloneNode(true));
          console.log('code cell was executee #', child.model.executionCount);

          // widgets == representation, model == data
          for (let i = 0; i < outputArea.model.length; i++) {
            const output: IOutputModel = outputArea.model.get(i);
            const type = output.type as OutputType;
            // types:
            // * stream:  prints or streaming outputs (there can be multiple stream outputs, e.g., for stdout and stderr)
            // * execute_result: last line of cell
            // * display_data:  seaborn/matplotlib
            // * update_display_data: update a display_data output
            // * error: errors during code execution
            // also see: https://jupyter-client.readthedocs.io/en/stable/messaging.html#execution-errors

            const data = output.data;
            // data:
            // * text/plain: print() output
            // * text/html: e.g., pandas dataframes
            // * image/png: e.g., seaborn/matplotlib
            // * image/jpeg
            // * image/svg+xml
            // * application/vnd.jupyter.stderr: print to stderr  (e.g. warnings)
            // * application/vnd.jupyter.stdout: print to stdout

            //executionCount is shown for input and output (but only for 'execute_result' type)
            console.log('output', i, output.executionCount, type, Object.keys(output.data));
          }

          const model = notebook.model;
          const cell3 = model?.cells.get(3);
          console.log('cell type', cell3?.type, 'val', cell3?.value);
          console.log('cell', cell3);

          //TODO render using editor?

          // TODO use signals to open up the details panel

          cellProv = { ...cellProv, output: outputArea.model.toJSON() } as CodeCellProvenance;
        } else if (child instanceof MarkdownCell) {
          //MarkdownCell extends attachmentcell which extends cell
          // console.log('markdown headlines', child.headingInfo);
          //console.log('markdown headlines', child.headings); // requires jupyter 4

          // copy/pasted images, for example, are attachments
          const attachments = child.model.attachments;
          console.log('attachments', attachments.keys);
          // const attachmentData = attachments.get(attachments.keys[0]);
          cellProv = { ...cellProv, attachments: attachments.toJSON() } as MarkdownCellProvenance;
        } else if (child instanceof RawCell) {
          //RawCell extends cell
          // no special information
          console.log('raw');
        } else {
          console.log('unknown cell');
        }
        prov.cells.push(cellProv);
      }
      console.log('---');
    }

    if (cell instanceof CodeCell) {
      const { outputArea } = cell as CodeCell;
      const children = toArray(outputArea.children());
      console.log(children);
    }

    //check if it is the notebook tracked by this instance
    if (notebook.id === this.notebook.id) {
      this.nbtrrack.apply('execute', prov);
    } else {
      console.debug('a different notebook was executed');
    }
  }
}

export type CellProvenance = {
  id: string;
  type: CellType;
  input: ICell;
  active: boolean;
};

export type CodeCellProvenance = CellProvenance & { cellType: 'code'; output: IOutput[] };
export type MarkdownCellProvenance = CellProvenance & { cellType: 'markdown'; attachments: IAttachments };

export type NotebookProvenance = {
  cells: CellProvenance[];
};
