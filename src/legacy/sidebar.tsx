'use strict';
import { NotebookProvenance } from '../Provenance/notebook-provenance';
import { LabShell } from '@jupyterlab/application';
import {
  NotebookPanel,
  Notebook,
  INotebookTracker
} from '@jupyterlab/notebook';
import { notebookModelCache } from '..';
import { Message } from '@lumino/messaging';
import '../../style/side-bar.css';
import { Panel, SplitPanel, StackedPanel } from '@lumino/widgets';
import { CellView } from './cell-view';
import { ProvGraph } from './prov-graph';

/**
 * The main view for the notebook provenance.
 */
export class SideBar extends StackedPanel {
  // ui elements
  private errorWidget: Panel;
  private splitPanel: SplitPanel;
  private cellView: CellView;
  private provGraph: ProvGraph;

  // data
  private notebookProvenance: NotebookProvenance | null;

  constructor(private shell: LabShell, private nbTracker: INotebookTracker) {
    super();

    this.addClass('jp-nbprovenance-view');

    // setup error message
    this.errorWidget = new Panel();
    this.addWidget(this.errorWidget);

    const error = document.createElement('p');
    error.innerText = 'NO PROVENANCE DATA';
    error.className = 'error-message';
    this.errorWidget.node.appendChild(error);

    // setup content panel
    this.splitPanel = new SplitPanel();
    this.splitPanel.orientation = 'vertical';
    this.addWidget(this.splitPanel);

    // Add cell view panel
    this.cellView = new CellView();
    this.splitPanel.addWidget(this.cellView);

    // Add prov graph panel
    this.provGraph = new ProvGraph();
    this.splitPanel.addWidget(this.provGraph);

    this.reset();
  }

  /**
   * The summary text element associated with the widget.
   */
  readonly summary: HTMLParagraphElement;

  /**
   * The summary text element associated with the widget.
   */
  readonly provtree: HTMLDivElement;

  /**
   * Handle update requests for the widget.
   */
  async onUpdateRequest(msg: Message): Promise<void> {
    if (!this.isVisible) {
      return;
    }

    // update provenance information only for the current widget
    if (
      this.shell.currentWidget instanceof NotebookPanel &&
      this.nbTracker.currentWidget === this.shell.currentWidget
    ) {
      const notebook: Notebook = this.nbTracker.currentWidget.content;
      this.notebookProvenance = notebookModelCache.has(notebook)
        ? notebookModelCache.get(notebook)!
        : null;

      if (this.notebookProvenance) {
        // show content and update cell view and prov tree
        this.splitPanel.show();
        this.errorWidget.hide();
        this.cellView.setup(this.notebookProvenance);
        this.provGraph.setup(this.notebookProvenance);
      }
    } else {
      this.reset();
    }
  }

  /**
   * remove provenace visualization
   */
  reset() {
    this.notebookProvenance = null;
    this.splitPanel.hide();
    this.errorWidget.show();
  }
}
