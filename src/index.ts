import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Overview } from './Overview/Overview';
import { loopsLabIcon } from './loopsLabIcon';


function activate(app: JupyterFrontEnd, restorer: ILayoutRestorer): void {
  console.log('Activate JupyterLab extension: loops');

  const widget = new Overview(app);
  widget.id = 'DiffOverview'
  widget.title.label = ``; //just the icon
  widget.title.icon = loopsLabIcon;
  
  app.shell.add(widget, 'left'); // the sidebar
}

/**
 * Initialization data for the loops extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'loops:plugin',
  autoStart: true,
  activate
};

export default plugin;
