import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Overview } from './Overview/Overview';
import { loopsLabIcon } from './loopsLabIcon';
import {
  Notebook,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';
import { NotebookProvenance } from './Provenance/notebook-provenance';
import { SideBar } from './legacy/sidebar';
import { Widget } from '@lumino/widgets';

// Storage of notebooks and their trrack provenance
export const notebookModelCache = new Map<Notebook, NotebookProvenance>();

function activate(
  app: JupyterFrontEnd,
  nbTracker: INotebookTracker,
  restorer: ILayoutRestorer,
  labShell: ILabShell
): void {
  console.debug('Activate JupyterLab extension: loops');

  const widget = new Overview(app, nbTracker);
  widget.id = 'DiffOverview';
  widget.title.label = ''; // no text, just the icon
  widget.title.icon = loopsLabIcon;
  restorer.add(widget, 'loops_overview'); // if the sidebar was open, open it again on reload
  app.shell.add(widget, 'left'); // the sidebar

  const provenanceView: Widget = new SideBar(labShell, nbTracker);
  provenanceView.id = 'nbprovenance-view';
  provenanceView.title.caption = 'Notebook Provenance';
  provenanceView.title.iconClass = 'jp-nbprovenanceIcon';
  restorer.add(provenanceView, 'nbprovenance_view');
  app.shell.add(provenanceView, 'right', { rank: 700 }); // rank was chosen arbitrarily

  labShell.currentChanged.connect((sender, args) => {
    //Focused thing in main area changes, e.g., another
    // * notebook
    // * terminal
    // * textfile
    console.info('currentChanged', args);
    provenanceView.update();
    widget.update();
  });

  // nbTracker.widgetAdded.connect((sender, nb) => {
  //   // new tabs that are being added
  //   console.info('widget added', nb);
  // });

  if (nbTracker) {
    console.debug('connect to notebook tracker');
    nbTracker.currentChanged.connect((sender, notebookEditor) => {
      // called when the current notebook changes
      // only tracks notebooks! not other files or tabs
      console.info(
        'notebook changed. New Notebook:',
        notebookEditor?.title.label
      );
      if (notebookEditor) {
        //testEventHandlers(notebookEditor);

        notebookEditor.sessionContext.ready.then(() => {
          console.info(notebookEditor.title.label, 'session ready');

          const notebook: Notebook = notebookEditor.content;
          // add the notebook to the cache
          if (!notebookModelCache.has(notebook)) {
            notebookModelCache.set(
              notebook,
              new NotebookProvenance(notebook, notebookEditor.context)
            );
            // remove the notebook when they are closed
            notebook.disposed.connect((notebook: Notebook) =>
              notebookModelCache.delete(notebook)
            );
          }
          // update the UI
          // provenanceView.update();

          // const kernel = nb.sessionContext.session?.kernel;
          // if (kernel) {
          //   console.debug('kernel', kernel.name);
          // }
        });
      } else {
        console.error('no notebook');
        // update the UI
        // provenanceView.update();
      }
    });
  } else {
    console.error('no notebook tracker');
  }
}

/**
 * Initialization data for the loops extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'loops:plugin',
  autoStart: true,
  activate,
  requires: [
    INotebookTracker,
    ILayoutRestorer,
    ILabShell
    // ISettingRegistry,
    // IRenderMimeRegistry
  ]
};

export default plugin;

function testEventHandlers(nb: NotebookPanel) {
  const model = nb.model;
  const notebook = nb.content;
  // Notebook events (related to notebook content):
  notebook.modelChanged.connect((sender, args) => {
    console.debug('modelChanged', args);
  });
  notebook.stateChanged.connect((sender, args) => {
    //different staet properties have their events, like
    // mode  (edit, command, ..?)
    // activeCellIndex
    console.debug('stateChanged', args);
  });
  notebook.activeCellChanged.connect((sender, args) => {
    // args contain node html
    console.debug('activeCellChanged', args);
  });
  notebook.selectionChanged.connect((sender, args) => {
    console.debug('selectionChanged', args);
  });
  notebook.modelContentChanged.connect((sender, args) => {
    console.debug('modelContentChanged', args);
  });
  // session events (related to backend/kernel)
  nb.sessionContext.kernelChanged.connect((sender, kernel) => {
    console.debug('kernel changed', kernel);
  });
  nb.sessionContext.sessionChanged.connect((sender, session) => {
    console.debug('session changed', session);
  });
  nb.sessionContext.statusChanged.connect((sender, kernel) => {
    console.debug('statusChanged', kernel);
  });
}
