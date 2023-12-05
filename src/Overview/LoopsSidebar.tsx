import { ILabShell, JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';
import { MantineProvider, createEmotionCache } from '@mantine/core';
import React, { createContext, useEffect } from 'react';
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
      <MantineProvider
        emotionCache={loopsCache}
        withGlobalStyles
        withNormalizeCSS
        theme={{
          primaryColor: 'teal'
        }}
      >
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

  // add openCV script to the page
  // do it in the sidebar, because that will stay around (unless moving it between left and right sidebar)
  // loading openCV, especially the WASM version, takes a while and we don't want to do that every time we open a detail view
  useEffect(() => {
    console.info('➕ Add OpenCV script to the page');
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    document.body.appendChild(script);
    script.addEventListener('load', printOpenCV);

    return () => {
      console.info('➖ Remove OpenCV script from the page');
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div lang="en" className={classes.loopsOverviewRoot} id="overview-root">
      <OverviewHeader labShell={labShell}></OverviewHeader>
      <StateList nbTracker={nbTracker} labShell={labShell} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: '1em',
          borderTop: '1px solid var(--jp-toolbar-border-color)'
        }}
      >
        <span style={{ background: '#66C2A599', padding: '0 1em', borderRadius: '1em' }}>added</span>
        <span style={{ background: '#FBE15699', padding: '0 1em', borderRadius: '1em' }}>changed</span>
        <span style={{ background: '#F0526899', padding: '0 1em', borderRadius: '1em' }}>removed</span>
      </div>
    </div>
  );
}

// ts ignore this function because we don't have the type for the WASM version
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function printOpenCV() {
  // https://stackoverflow.com/a/63211547/2549748
  console.info('OpenCV script loaded');
  const opencv = (window as any).cv;
  if (opencv.getBuildInformation) {
    // ASM
    console.debug('Using Openopencv ASM build');
    (opencv as any).onRuntimeInitialized = () => {
      console.log('OpenCV ASM Runtime initialized');
      // console.log(opencv.getBuildInformation());
    };
  } else {
    // WASM takes a while to load so getBuildInformation is not available immediately --> thus opencv.getBuildInformation is undefined
    console.debug('Using Openopencv WASM build');
    (opencv as any).onRuntimeInitialized = () => {
      console.log('OpenCV WASM Runtime initialized');
      // console.log(opencv.getBuildInformation());
    };
  }
}
