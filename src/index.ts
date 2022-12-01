import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the loops extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'loops:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension loops is activated!');
  }
};

export default plugin;
