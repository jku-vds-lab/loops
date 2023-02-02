import { ReactWidget, Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { Panel } from '@lumino/widgets';
import '../../style/cell-view.css';
import {
  undoIcon,
  redoIcon,
  HTMLSelect,
  runIcon
} from '@jupyterlab/ui-components';
import { isChildNode, Provenance, ProvenanceNode } from '@visdesignlab/trrack';
import {
  EventType,
  IApplicationExtra,
  IApplicationState,
  NotebookProvenance,
  INBCell
} from '../Provenance/notebook-provenance';
import { Notebook } from '@jupyterlab/notebook';
import { interpolateReds } from 'd3-scale-chromatic';
import React from 'react';

export class CellView extends Panel {
  // ui elements
  private cellList: Panel;
  private undoButton: ToolbarButton;
  private redoButton: ToolbarButton;

  // data
  private notebookProvenance: NotebookProvenance;
  private notebook: Notebook;
  private prov: Provenance<IApplicationState, EventType, IApplicationExtra>;

  private cellVersions: Map<string, Array<string>>;
  private visProperty = 'versions';

  constructor() {
    super();

    this.addClass('np-cellview');

    // add toolbar
    let toolbar = new Toolbar();
    toolbar.addClass('np-cellviewtoolbar');
    this.addWidget(toolbar);

    // add highlight property dropdown
    let visSelect = ReactWidget.create(
      React.createElement(HTMLSelect, {
        options: ['versions', 'executions'],
        onChange: x => {
          this.visProperty = x.target.value;
          this.update();
        }
      })
    );
    toolbar.addItem('dropdown', visSelect);
    toolbar.addItem('spacer', Toolbar.createSpacerItem());

    // add undo redo buttons
    this.undoButton = new ToolbarButton({
      icon: undoIcon,
      onClick: () => {
        const undoNode = this.getUndoNode();
        if (undoNode) {
          this.notebookProvenance.goToNode(undoNode);
        }
      }
    });

    this.redoButton = new ToolbarButton({
      icon: redoIcon,
      onClick: () => {
        const redoNode = this.getRedoNode();
        if (redoNode) {
          this.notebookProvenance.goToNode(redoNode);
        }
      }
    });

    toolbar.addItem('undo', this.undoButton);
    toolbar.addItem('redo', this.redoButton);

    // add cell list
    this.cellList = new Panel();
    this.cellList.addClass('np-cellviewlist');
    this.addWidget(this.cellList);
  }

  /**
   * Set notebook and provenance properties, then update view
   */
  public setup(notebookProvenance: NotebookProvenance) {
    this.notebookProvenance = notebookProvenance;
    this.notebook = notebookProvenance.notebook;
    this.prov = notebookProvenance.prov;
    this.prov.addGlobalObserver(() => {
      this.update();
    });
    this.update();
  }

  /**
   * Handle update request. Generate cell list and setup undo/redo buttons.
   */
  protected onUpdateRequest() {
    if (!this.isVisible || !this.prov) {
      return;
    }

    // build cellVersions map
    this.buildCellVersionsMap();

    // minimum value is 10
    let maxValue = 10;

    switch (this.visProperty) {
      case 'version':
        // calculate max version for color gradient, 10 as minimum
        this.cellVersions.forEach(
          v => (maxValue = Math.max(v.length - 1, maxValue))
        );
        break;
      case 'executions':
        // calculate max execution count
        this.prov.state.model.cells.forEach(
          c => (maxValue = Math.max(this.countExecutions(c), maxValue))
        );
        break;
      default:
    }

    // clear list
    while (this.cellList.node.firstChild) {
      this.cellList.node.firstChild.remove();
    }

    // create cell list
    this.prov.state.model.cells.forEach((c, i) => {
      // add cell
      const cell = document.createElement('div');
      cell.className = 'np-cellviewcell';
      cell.addEventListener('click', () => {
        this.notebookProvenance.setActiveCellIndex(i);
        this.updateActiveCell();
      });
      this.cellList.node.appendChild(cell);
      const version = this.cellVersions.has(c.id)
        ? this.cellVersions.get(c.id)!.length
        : 0;
      const executionCount = this.countExecutions(c);
      const value = this.visProperty === 'versions' ? version : executionCount;

      // set style
      cell.style.background = interpolateReds(value / maxValue);
      cell.style.color = value / maxValue > 0.5 ? 'white' : 'black';

      // show version number and execution count
      const propDiv = document.createElement('div');
      const verText = document.createElement('p');
      verText.innerText = 'v' + version;
      propDiv.appendChild(verText);
      if (c.cell_type === 'code') {
        propDiv.appendChild(
          runIcon.element({ className: 'np-runicon', width: 20, height: 20 })
        );
        const exeText = document.createElement('div');
        exeText.innerText = executionCount.toString();
        propDiv.appendChild(exeText);
      }
      cell.appendChild(propDiv);

      // add cell content
      const content = document.createElement('p');
      let text = Array.isArray(c.source) ? c.source : c.source.split('\n');
      content.innerText = text.slice(0, 10).join('\n'); // only take the first 10 lines
      cell.appendChild(content);

      // scroll to active cell
      if (this.notebook.activeCellIndex === i) {
        cell.scrollIntoView();
      }
    });

    // update selected cell and undo redo buttons
    this.updateActiveCell();
  }

  /**
   * Set the class for the selected cell and update undo redo buttons
   */
  private updateActiveCell() {
    Array.from(this.cellList.node.children).forEach((c, i) => {
      if (this.notebook.activeCellIndex === i) {
        c.classList.add('np-selectedcell');
      } else {
        c.classList.remove('np-selectedcell');
      }
    });

    // update undo redo buttons
    this.undoButton.node.firstElementChild?.toggleAttribute(
      'disabled',
      this.getUndoNode() === null ? true : false
    );
    this.redoButton.node.firstElementChild?.toggleAttribute(
      'disabled',
      this.getRedoNode() === null ? true : false
    );
  }

  /**
   * Find the last non-ephemeral node where the active cell has changed
   * @returns the node id to jump to or null if none exists
   */
  private getUndoNode(): string | null {
    if (!isChildNode(this.prov.current) || !this.notebook.activeCell) {
      return null;
    }

    // search for node upwards in the tree
    let node = this.prov.graph.nodes[this.prov.current.parent];
    while (
      isChildNode(node) &&
      (!this.hasActiveCellChanged(node) || node.actionType === 'Ephemeral')
    ) {
      node = this.prov.graph.nodes[node.parent];
    }

    return this.hasActiveCellChanged(node) && node.actionType === 'Regular'
      ? node.id
      : this.prov.current.parent
      ? this.prov.current.parent
      : null;
  }

  /**
   * Find the next non-ephemeral node where the active cell will change
   * @returns the node id to jump to or null if none exists
   */
  private getRedoNode(): string | null {
    if (
      !this.prov.current.children ||
      this.prov.current.children.length === 0 ||
      !this.notebook.activeCell
    ) {
      return null;
    }

    // search for node downwards in the tree
    let node =
      this.prov.graph.nodes[
        this.prov.current.children[this.prov.current.children.length - 1]
      ];
    while (
      node.children.length > 0 &&
      (!this.hasActiveCellChanged(node) || node.actionType === 'Ephemeral')
    ) {
      node = this.prov.graph.nodes[node.children[node.children.length - 1]];
    }

    return this.hasActiveCellChanged(node) && node.actionType === 'Regular'
      ? node.id
      : null;
  }

  /**
   * Check if the active cell has been changed in this node
   * @param node the node to check
   * @returns true if the active cell has been changed
   */
  private hasActiveCellChanged(
    node: ProvenanceNode<EventType, IApplicationExtra>
  ): boolean {
    return (
      this.prov.getState(node).model.cells[node.metadata.changedCellId]?.id ===
      this.notebook.model?.cells.get(this.notebook.activeCellIndex).id
    );
  }

  /**
   * Build the cellVersions map
   * Every regular action counts, so no activeCell events
   */
  private buildCellVersionsMap() {
    this.cellVersions = new Map();

    if (!isChildNode(this.prov.current)) {
      return;
    }

    // traverse upwards in the tree
    let node: ProvenanceNode<EventType, IApplicationExtra> | null =
      this.prov.graph.nodes[this.prov.current.id];
    while (node) {
      if (node.actionType === 'Regular') {
        // get id of changed cell
        const cellId =
          this.prov.getState(node).model.cells[node.metadata.changedCellId]?.id;
        if (cellId) {
          // init array if necessary
          if (!this.cellVersions.has(cellId)) {
            this.cellVersions.set(cellId, []);
          }
          // add node id to array
          this.cellVersions.get(cellId)?.push(node.id);
        }
      }
      node = isChildNode(node) ? this.prov.graph.nodes[node.parent] : null;
    }
  }

  /**
   * Returns the number of executions of a cell; 0 if not code cell
   * @param cell Notebook cell
   * @returns number of executions
   */
  private countExecutions(cell: INBCell): number {
    const versions = this.cellVersions.get(cell.id);
    if (versions) {
      return versions.filter(
        id =>
          this.prov.graph.nodes[id].metadata.eventType === EventType.executeCell
      ).length;
    } else {
      return 0;
    }
  }
}
