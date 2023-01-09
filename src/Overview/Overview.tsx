import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { OverviewHeader } from './OverviewHeader';
import { StateList } from './StateList';

import { createContext } from 'react';
export const JupyterAppContext = createContext({} as JupyterFrontEnd);

// My "React Style" Component
function OverviewComponent({ app }: { app: JupyterFrontEnd }) {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <JupyterAppContext.Provider value={app}>
        <div className="loops-overview-root">
          <OverviewHeader></OverviewHeader>
          <StateList />
        </div>
      </JupyterAppContext.Provider>
    </MantineProvider>
  );
}

/**
 * Subclassing ReactWidget to add the component to Jupyter and handle potential Juypter life cycle events
 * see https://jupyterlab.readthedocs.io/en/stable/extension/virtualdom.html
 */
export class Overview extends ReactWidget {
  constructor(private app: JupyterFrontEnd) {
    super();
    this.addClass('jp-ReactWidget');
  }

  render(): JSX.Element {
    return <OverviewComponent app={this.app} />;
  }
}
