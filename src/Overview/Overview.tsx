import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISignal, Signal } from '@lumino/signaling';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { OverviewHeader } from './OverviewHeader';
import { StateList } from './StateList';
import { Message } from '@lumino/messaging';
import {
  Notebook,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import { createContext } from 'react';
import { notebookModelCache } from '..';
import { Provenance } from '@visdesignlab/trrack';
import {
  EventType,
  IApplicationExtra,
  IApplicationState
} from '../Provenance/notebook-provenance';

export const JupyterAppContext = createContext({} as JupyterFrontEnd);
export const JupyterProvenanceContext = createContext(
  {} as Provenance<IApplicationState, EventType, IApplicationExtra> | undefined
);

/**
 * Subclassing ReactWidget to add the component to Jupyter and handle potential Juypter life cycle events
 * see https://jupyterlab.readthedocs.io/en/stable/extension/virtualdom.html
 */
export class Overview extends ReactWidget {
  constructor(
    private app: JupyterFrontEnd,
    private nbTracker: INotebookTracker
  ) {
    super();
    this.addClass('jp-ReactWidget');

    // const date = new Date().toLocaleTimeString();

    // // get provenance for current notebook
    // this.notebook = this.nbTracker.currentWidget?.content; //can be undefined
    // this.notebookProvenance = this.notebook
    //   ? notebookModelCache.get(this.notebook) // undefined if not found
    //   : undefined; // or if the notebook is undefined in the first place
    // // components will handle the undefined variables themselves

    // this.notebookProvenance?.prov.addGlobalObserver(() => {
    //   console.log('overview global observer fires 🔥🔥🔥🔥 -  created ', date);
    //   this.update();
    // });
  }

  render(): JSX.Element {
    console.log('Overview render');

    const date = new Date().toLocaleTimeString();

    // get provenance for current notebook
    const notebook = this.nbTracker.currentWidget?.content; //can be undefined
    const notebookProvenance = notebook
      ? notebookModelCache.get(notebook) // undefined if not found
      : undefined; // or if the notebook is undefined in the first place
    // components will handle the undefined variables themselves

    notebookProvenance?.prov.addGlobalObserver((graph, change) => {
      console.log('overview global observer fires 🔥🔥🔥🔥 -  created ', date);
      this.update();
    });

    return (
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <JupyterAppContext.Provider value={this.app}>
          <div className="loops-overview-root">
            {/* <OverviewHeader
              notebookVisible={this.nbTracker.currentWidget?.isVisible}
              notebookTitle={this.nbTracker.currentWidget?.title.label}
            ></OverviewHeader> */}

            <JupyterProvenanceContext.Provider value={notebookProvenance?.prov}>
              <StateList notebook={notebook} />
            </JupyterProvenanceContext.Provider>
          </div>
        </JupyterAppContext.Provider>
      </MantineProvider>
    );
  }

  onAfterAttach(msg: Message): void {
    console.log('Overview onAfterAttach');
    super.onAfterAttach(msg);
  }

  async onUpdateRequest(msg: Message): Promise<void> {
    console.log('Overview updating');
    super.onUpdateRequest(msg);
  }
}
