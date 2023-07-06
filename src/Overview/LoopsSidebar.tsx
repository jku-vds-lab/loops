import { ILabShell, JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';
import { MantineProvider, createEmotionCache } from '@mantine/core';
import React, { createContext } from 'react';
import { OverviewHeader } from './OverviewHeader';
import { StateList } from './StateList';

export const JupyterAppContext = createContext({} as JupyterFrontEnd);

const loopsCache = createEmotionCache({
  key: 'loops',
  stylisPlugins: [] // disable vendor prefixing
});

/**
 * Subclassing ReactWidget to add the component to Jupyter and handle potential Juypter life cycle events
 * see https://jupyterlab.readthedocs.io/en/stable/extension/virtualdom.html
 */
export class LoopsSidebar extends ReactWidget {
  constructor(private app: JupyterFrontEnd, private nbTracker: INotebookTracker, private labShell: ILabShell) {
    super();
    this.addClass('jp-ReactWidget');
  }

  render(): JSX.Element {
    // console.log('render: LoopsSidebar');

    return (
      <MantineProvider emotionCache={loopsCache} withGlobalStyles withNormalizeCSS>
        <JupyterAppContext.Provider value={this.app}>
          <LoopsOverview nbTracker={this.nbTracker} labShell={this.labShell} />
        </JupyterAppContext.Provider>
      </MantineProvider>
    );
  }

  onAfterAttach(msg: Message): void {
    // console.log('Overview onAfterAttach');
    super.onAfterAttach(msg);
  }

  onUpdateRequest(msg: Message): void {
    // console.log('Overview updating');
    super.onUpdateRequest(msg);
  }
}

import { createStyles } from '@mantine/core';

const useStyles = createStyles((theme, _params, getRef) => ({
  loopsOverviewRoot: {
    height: '100%',
    width: '100%',

    display: 'flex',
    flexDirection: 'column',

    label: 'loops-overview-root'
  }
}));

interface ILoopsOverviewProbs {
  nbTracker: INotebookTracker;
  labShell: ILabShell;
}

function LoopsOverview({ nbTracker, labShell }: ILoopsOverviewProbs): JSX.Element {
  const { classes } = useStyles();
  return (
    <div className={classes.loopsOverviewRoot} id="overview-root">
      <OverviewHeader labShell={labShell}></OverviewHeader>
      <StateList nbTracker={nbTracker} labShell={labShell} />
    </div>
  );
}
