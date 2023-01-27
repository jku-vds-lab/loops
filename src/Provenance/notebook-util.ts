import { Notebook } from '@jupyterlab/notebook';
import { INBCell, INBModel } from './notebook-provenance';
import { ICellModel } from '@jupyterlab/cells';
import { findIndex } from '@lumino/algorithm';
import { CellType } from '@jupyterlab/nbformat';

/**
 * Utility functions for Jupyter Notebook
 */
export class NotebookUtil {
  /**
   * Export the cells of a notebook as JSON data
   */
  public static exportModel(notebook: Notebook): INBModel {
    const model: INBModel = { cells: [] };
    const cells = notebook.model?.cells;
    if (cells) {
      for (let i = 0; i < cells.length; i++) {
        const cell = this.exportCell(notebook, i);
        if (cell) {
          model.cells.push(cell);
        }
      }
    }
    return model;
  }

  /**
   * Export a cell of a notebook as JSON data
   */
  public static exportCell(notebook: Notebook, index: number): INBCell | null {
    const cell = notebook.model?.cells.get(index);
    if (cell) {
      const exportedCell = cell.toJSON();
      // add id to cell json data to allow tracking
      exportedCell.id = cell.id;
      // an empty execution count is exported as an empty object, which the import function complains about
      if (typeof exportedCell.execution_count === 'object') {
        exportedCell.execution_count = null;
      }
      return exportedCell as INBCell;
    }
    return null;
  }

  /**
   * Import the cells of a notebook from JSON data
   */
  public static importModel(notebook: Notebook, impModel: INBModel): void {
    const model = notebook.model;
    if (model) {
      model.cells.beginCompoundOperation();
      // model.cells.clear(); works but throws exception because model is undefined; doing it manually to avoid error
      while (model.cells.length > 0) {
        model.cells.remove(model.cells.length - 1);
      }
      model.cells.pushAll(
        impModel.cells.map(cell =>
          model.contentFactory.createCell(cell.cell_type as CellType, {
            id: cell.id,
            cell
          })
        )
      );
      model.cells.endCompoundOperation();
    }
  }

  /**
   * Get the index of a cell
   */
  public static getCellIndex(notebook: Notebook, cell: ICellModel): number {
    let index = -1;
    if (notebook.model && notebook.model.cells) {
      index = findIndex(notebook.model.cells, c => c === cell);
    } else {
      throw new Error('Unable to find cell in notebook');
    }
    return index;
  }
}
