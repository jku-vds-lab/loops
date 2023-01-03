import {
  JupyterFrontEnd
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';
import { DiffDetail } from './DiffDetail';
//import { MainAreaWidget } from '@jupyterlab/apputils';
//import { loopsLabIcon } from './loopsLabIcon';

const widget = new DiffDetail();
widget.id = 'DiffDetail';
//const widget = new MainAreaWidget<DiffDetail>({ content });
//widget.title.label = 'React Widget';
//widget.title.icon = loopsLabIcon;


export class DiffOverview extends ReactWidget {

  constructor(private app: JupyterFrontEnd) {
    super();
    this.addClass('jp-ReactWidget');
  }

  render(): JSX.Element {
    return <div className='diff-overview'>
    <div className="header">
      <button onClick={this.handleClick}>Open Detail Pane</button>
    </div>
    <div className="notebook">
        <div className="cell CodeMirror"> 1<br/>2</div>
        <div className="cell CodeMirror">2</div>
        <div className="cell CodeMirror">3</div>
    </div>
  </div>
  }

  handleClick = () => {
    console.log('Click happened');
    this.app.shell.add(widget , 'down'); // the sidebar
  };
}
