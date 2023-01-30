import { ILabShell, JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';
import { MantineProvider } from '@mantine/core';
import React from 'react';
import { OverviewHeader } from './OverviewHeader';
import { StateList } from './StateList';

import { Provenance, ProvenanceGraph } from '@visdesignlab/trrack';
import { createContext } from 'react';
import { notebookModelCache } from '..';
import {
  EventType,
  IApplicationExtra,
  IApplicationState
} from '../Provenance/notebook-provenance';
import { ChangeType } from '@visdesignlab/trrack/dist/Types/Observers';

export const JupyterAppContext = createContext({} as JupyterFrontEnd);
export const JupyterProvenanceContext = createContext(
  {} as Provenance<IApplicationState, EventType, IApplicationExtra> | undefined
);

/**
 * Subclassing ReactWidget to add the component to Jupyter and handle potential Juypter life cycle events
 * see https://jupyterlab.readthedocs.io/en/stable/extension/virtualdom.html
 */
export class LoopsSidebar extends ReactWidget {
  constructor(
    private app: JupyterFrontEnd,
    private nbTracker: INotebookTracker,
    private labShell: ILabShell
  ) {
    super();
    this.addClass('jp-ReactWidget');
  }

  render(): JSX.Element {
    console.log('render: LoopsSidebar');

    // const date = new Date().toLocaleTimeString();

    // // get provenance for current notebook
    // const notebook = this.nbTracker.currentWidget?.content; //can be undefined
    // const notebookProvenance = notebook
    //   ? notebookModelCache.get(notebook) // undefined if not found
    //   : undefined; // or if the notebook is undefined in the first place
    // // components will handle the undefined variables themselves

    // notebookProvenance?.prov.addGlobalObserver(
    //   (
    //     graph?: ProvenanceGraph<EventType, IApplicationExtra>,
    //     changeType?: ChangeType
    //   ) => {
    //     console.log(
    //       'overview global observer fires 🔥🔥🔥🔥 -  created ',
    //       date,
    //       graph,
    //       changeType
    //     );
    //     this.update();
    //   }
    // );

    return (
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <JupyterAppContext.Provider value={this.app}>
          <LoopsOverview nbTracker={this.nbTracker} labShell={this.labShell} />
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
interface ILoopsOverviewProbs {
  nbTracker: INotebookTracker;
  labShell: ILabShell;
}

function LoopsOverview({
  nbTracker,
  labShell
}: ILoopsOverviewProbs): JSX.Element {
  return (
    <div className="loops-overview-root">
      <OverviewHeader
        nbTracker={nbTracker}
        labShell={labShell}
      ></OverviewHeader>

      {/* <JupyterProvenanceContext.Provider value={notebookProvenance?.prov}>
        <StateList notebook={notebook} />
      </JupyterProvenanceContext.Provider> */}
    </div>
  );
}
