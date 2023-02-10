import {
  IApplicationState,
  EventType,
  IApplicationExtra,
  NotebookProvenance
} from '../Provenance/notebook-provenance';
import { createEventConfig } from './event-config';

import {
  EventConfig,
  ProvVisConfig,
  ProvVisCreator
} from '@jku-icg/trrack-notebook-vis';
import { isChildNode, NodeID, Provenance } from '@visdesignlab/trrack';

import { Panel, Widget } from '@lumino/widgets';
import {
  addToolbarButtonClass,
  ReactWidget,
  Toolbar,
  ToolbarButton
} from '@jupyterlab/apputils';
import { undoIcon, redoIcon, Button } from '@jupyterlab/ui-components';

import React from 'react';

import '../../style/prov-graph.css';

export class ProvGraph extends Panel {
  // ui elements
  private graph: Panel;
  private undoButton: ToolbarButton;
  private redoButton: ToolbarButton;

  // data
  private notebookProvenance: NotebookProvenance;
  private prov: Provenance<IApplicationState, EventType, IApplicationExtra>;
  private eventConfig: EventConfig<EventType>;
  private filterButtons: Map<EventType, Widget>;
  private filter: Set<EventType>;

  constructor() {
    super();

    this.addClass('np-provgraph');

    // setup event config
    this.eventConfig = createEventConfig();

    // add toolbar
    let toolbar = new Toolbar();
    toolbar.addClass('np-provgraphtoolbar');
    this.addWidget(toolbar);

    // add filter buttons
    this.filterButtons = new Map<EventType, ToolbarButton>();
    for (const e in EventType) {
      const button = ReactWidget.create(
        React.createElement(
          Button,
          {
            className: 'jp-ToolbarButtonComponent np-filterbutton',
            title: e + '\n' + this.eventConfig[e].description,
            minimal: true,
            onClick: () => this.toggleFilter(e as EventType, button)
          },
          React.createElement(() => (
            <svg height="22px" width="22px">
              <g transform="translate(11, 11)">
                {this.eventConfig[e].backboneGlyph}
              </g>
            </svg>
          ))
        )
      );
      addToolbarButtonClass(button);
      toolbar.addItem('filter-' + e, button);
      this.filterButtons.set(e as EventType, button);
    }

    // add undo redo buttons
    this.undoButton = new ToolbarButton({
      icon: undoIcon,
      onClick: () => {
        if (isChildNode(this.prov.current)) {
          this.notebookProvenance.undo();
        }
      }
    });

    this.redoButton = new ToolbarButton({
      icon: redoIcon,
      onClick: () => {
        if (this.prov.current.children.length > 0) {
          this.notebookProvenance.redo();
        }
      }
    });

    // spacer is used to separate filter buttons and undo/redo buttons
    const undoRedo = new Panel();
    undoRedo.addClass('np-toolbarspacer');
    addToolbarButtonClass(undoRedo);
    undoRedo.addWidget(Toolbar.createSpacerItem());
    undoRedo.widgets[0].addClass('np-toolbarspacer');
    undoRedo.addWidget(this.undoButton);
    undoRedo.addWidget(this.redoButton);
    toolbar.addItem('undoRedo', undoRedo);

    // add provenance panel
    this.graph = new Panel();
    this.graph.id = 'prov-div';
    this.addWidget(this.graph);
  }

  /**
   * Set provenance properties, then update view
   */
  public setup(notebookProvenance: NotebookProvenance) {
    this.filter = new Set<EventType>();
    this.notebookProvenance = notebookProvenance;
    this.prov = notebookProvenance.prov;
    this.prov.addGlobalObserver(() => this.updateUndoRedo());
    this.update();
  }

  /**
   * Handle update request. Create ProvVis and update undo/redo buttons.
   */
  protected onUpdateRequest() {
    if (!this.isVisible || !this.prov) {
      return;
    }

    // setup config
    let config: ProvVisConfig = {
      cellsVisArea: 50,
      eventConfig: this.eventConfig
    };

    // create ProvVis
    ProvVisCreator(
      this.graph.node,
      this.prov,
      (id: NodeID) => this.notebookProvenance.goToNode(id),
      false,
      true,
      this.prov.graph.root,
      config,
      this.filter
    );

    // update undo redo buttons
    this.updateUndoRedo();
  }

  /**
   * Update undo redo buttons
   */
  private updateUndoRedo() {
    this.undoButton.node.firstElementChild?.toggleAttribute(
      'disabled',
      isChildNode(this.prov.current) ? false : true
    );
    this.redoButton.node.firstElementChild?.toggleAttribute(
      'disabled',
      this.prov.current.children.length === 0 ? true : false
    );
  }

  /**
   * Toggle event type for filter and style class on the clicked button to visualize filter state
   * @param eventType the event type to filter
   * @param button the clicked button
   */
  private toggleFilter(eventType: EventType, button: ReactWidget) {
    if (this.filter.has(eventType)) {
      this.filter.delete(eventType);
      button.removeClass('np-filter-disabled');
    } else {
      this.filter.add(eventType);
      button.addClass('np-filter-disabled');
    }
    // update to apply filter
    this.update();
  }
}
