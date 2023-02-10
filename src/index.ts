import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { loopsLabIcon } from './loopsLabIcon';
import {
  Notebook,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';
import {
  EventType,
  IApplicationExtra,
  NotebookProvenance
} from './Provenance/notebook-provenance';
import { SideBar } from './legacy/sidebar';
import { Widget } from '@lumino/widgets';
import { LoopsSidebar } from './Overview/LoopsSidebar';
import { ProvenanceGraph } from '@visdesignlab/trrack';

// Storage of notebooks and their trrack provenance
export const notebookModelCache = new Map<Notebook, NotebookProvenance>();
export const notebookObserverCache = new Map<Notebook, ProvObserver>();

function activate(
  app: JupyterFrontEnd,
  nbTracker: INotebookTracker,
  restorer: ILayoutRestorer,
  labShell: ILabShell
): void {
  console.debug('Activate JupyterLab extension: loops');
  let observer: ProvObserver | undefined;

  // const provenanceView: Widget = new SideBar(labShell, nbTracker);
  // provenanceView.id = 'nbprovenance-view';
  // provenanceView.title.caption = 'Notebook Provenance';
  // provenanceView.title.iconClass = 'jp-nbprovenanceIcon';
  // restorer.add(provenanceView, 'nbprovenance_view');
  // app.shell.add(provenanceView, 'right', { rank: 700 }); // rank was chosen arbitrarily

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
          if (observer) {
            observer.enabled = false;
          }
          observer = new ProvObserver(loops);

          // add the notebook to the cache
          if (!notebookModelCache.has(notebook)) {
            const provenance = new NotebookProvenance(
              notebook,
              notebookEditor.context
            );
            notebookModelCache.set(notebook, provenance);
            const observer = new ProvObserver(loops);
            notebookObserverCache.set(notebook, observer);

            provenance?.prov.addGlobalObserver(
              observer.provObserver.bind(observer)
            );

            // remove the notebook when they are closed
            notebook.disposed.connect((notebook: Notebook) => {
              notebookModelCache.delete(notebook);
              notebookObserverCache.delete(notebook);
            });
          }
          // disable all observer in the cache and enable the observer for the current notebook
          notebookObserverCache.forEach((observer, cacheNotebook) => {
            console.log('enable?????', notebook.id === cacheNotebook.id);
            observer.enabled = notebook.id === cacheNotebook.id;
          });

          // update the UI
          // provenanceView.update();
          loops.update(); //update because the Provenance might not have been available wehn it was rendered first

          // const kernel = nb.sessionContext.session?.kernel;
          // if (kernel) {
          //   console.debug('kernel', kernel.name);
          // }
        });
      } else {
        // update the UI
        // provenanceView.update();
        //loops handles it internally
      }
    });
  } else {
    console.error('no notebook tracker');
  }

  const loops = new LoopsSidebar(app, nbTracker, labShell);
  loops.id = 'DiffOverview';
  loops.title.label = ''; // no text, just the icon
  loops.title.icon = loopsLabIcon;
  restorer.add(loops, 'loops_overview'); // if the sidebar was open, open it again on reload
  app.shell.add(loops, 'left'); // the sidebar

  console.log('JupyterLab extension loops is activated!');
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

class ProvObserver {
  enabled = true;
  created = new Date().toLocaleTimeString();
  constructor(private loops: LoopsSidebar) {}

  provObserver(
    graph: ProvenanceGraph<EventType, IApplicationExtra> | undefined,
    change: string | undefined
  ) {
    if (!this.enabled) {
      console.log('ignore event');
      return;
    }

    console.log(
      this.created,
      '*********** StateLists global observer fires 🔥🔥🔥🔥',
      change,
      Object.keys(graph?.nodes ?? {}).length
    );

    this.loops.update();
  }
}
