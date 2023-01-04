import {
  JupyterFrontEnd
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { DiffDetail } from './DiffDetail';
import { useState } from 'react';
import { Button } from '@mantine/core';
import { MantineProvider } from '@mantine/core';

// My "React Style" Component
function DiffOverviewComponent({ app }: { app: JupyterFrontEnd }) {
  let [detail, setDetail] = useState<DiffDetail>();

  function toggleDetails() {
    if (!detail) {
      detail = new DiffDetail()
      setDetail(detail)
      app.shell.add(detail, 'down'); // the sidebar
    } else {
      detail.dispose();
      setDetail(undefined)
    }
  }

  return (
  <MantineProvider withGlobalStyles withNormalizeCSS>
    <div className='diff-overview'>
      <div className="header">
        <Button onClick={toggleDetails}>Toggle Detail Pane</Button>
      </div>
      <div className="notebook">
        <div className="cell CodeMirror">1<br />2</div>
        <div className="cell CodeMirror">&nbsp;</div>
        <div className="cell CodeMirror">&nbsp;</div>
      </div>
    </div>
  </MantineProvider>
  );
}


/**
 * Subclassing ReactWidget to add the component to Jupyter and handle potential Juypter life cycle events
 * see https://jupyterlab.readthedocs.io/en/stable/extension/virtualdom.html
 */
export class DiffOverview extends ReactWidget {

  constructor(private app: JupyterFrontEnd) {
    super();
    this.addClass('jp-ReactWidget');
  }

  render(): JSX.Element {
    return <DiffOverviewComponent app={this.app} />
  }
}
