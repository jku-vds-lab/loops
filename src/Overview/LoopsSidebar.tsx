import { ILabShell, JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';
import { MantineProvider } from '@mantine/core';
import React from 'react';
import { OverviewHeader } from './OverviewHeader';
import { StateList } from './StateList';

import { Provenance } from '@visdesignlab/trrack';
import { createContext } from 'react';
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

  onUpdateRequest(msg: Message): void {
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
      <OverviewHeader labShell={labShell}></OverviewHeader>
      <StateList nbTracker={nbTracker} labShell={labShell} />
    </div>
  );
}
