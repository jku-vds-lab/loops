import { ILabShell, ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { loopsLabIcon } from './loopsLabIcon';
import { Notebook, INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { LoopsSidebar } from './Overview/LoopsSidebar';
import { NotebookTrrack } from './Provenance/NotebookTrrack';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

// Storage of notebooks and their trrack provenance
export const notebookModelCache = new Map<Notebook, NotebookTrrack>();

function activate(
  app: JupyterFrontEnd,
  nbTracker: INotebookTracker,
  labShell: ILabShell,
  settingRegistry: ISettingRegistry | null,
  restorer: ILayoutRestorer | null
): void {
  console.debug('Activate JupyterLab extension: loops');

  // nbTracker.widgetAdded.connect((sender, nb) => {
  //   // new tabs that are being added
  //   console.info('widget added', nb);
  // });

  if (settingRegistry) {
    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.log('loops settings loaded:', settings.composite);
      })
      .catch(reason => {
        console.error('Failed to load settings for loops.', reason);
      });
  }

  const loops = new LoopsSidebar(app, nbTracker, labShell);

  if (nbTracker) {
    console.debug('connect to notebook tracker');
    nbTracker.currentChanged.connect((sender, notebookEditor) => {
      // called when the current notebook changes
      // only tracks notebooks! not other files or tabs
      console.info('notebook changed. New Notebook:', notebookEditor?.title.label);
      if (notebookEditor) {
        //testEventHandlers(notebookEditor);
        notebookEditor.sessionContext.ready.then(() => {
          console.info(notebookEditor.title.label, 'session ready');
          const notebook: Notebook = notebookEditor.content;

          // add the notebook to the cache if necessary
          if (!notebookModelCache.has(notebook)) {
            const provenance = new NotebookTrrack(notebook);
            notebookModelCache.set(notebook, provenance);

            const unsubscribe = provenance.trrack.currentChange(trigger => {
              console.log('🔥 currentChange', trigger);
              loops.update();
            });

            // remove the notebook when they are closed
            notebook.disposed.connect((notebook: Notebook) => {
              unsubscribe();
              const trrack = notebookModelCache.get(notebook);
              if (trrack) {
                trrack.enabled = false;
              }
              notebookModelCache.delete(notebook);
            });
          }

          // disable all observer in the cache and enable the observer for the current notebook
          notebookModelCache.forEach((observer, cacheNotebook) => {
            console.log('enable?????', notebook.id === cacheNotebook.id);
            observer.enabled = notebook.id === cacheNotebook.id;
          });

          // update the UI
          loops.update(); //update because the Provenance might not have been available wehn it was rendered first

          // const kernel = nb.sessionContext.session?.kernel;
          // if (kernel) {
          //   console.debug('kernel', kernel.name);
          // }
        });
      } else {
        console.error('no editor for new notebook');
        //loops handles updating the UI internally
      }
    });
  } else {
    console.error('no notebook tracker');
  }

  loops.id = 'DiffOverview';
  loops.title.label = ''; // no text, just the icon
  loops.title.icon = loopsLabIcon;
  restorer?.add(loops, 'loops_overview'); // if the sidebar was open, open it again on reload
  app.shell.add(loops, 'left'); // the sidebar

  console.log('JupyterLab extension loops is activated!');
}

/**
 * Initialization data for the loops extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'loops:plugin',
  description: 'A JupyterLab extension to support iterative data analysis.',
  autoStart: true,
  activate,
  requires: [INotebookTracker, ILabShell],
  optional: [ISettingRegistry, ILayoutRestorer]
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

// class ProvObserver {
//   enabled = true;
//   created = new Date().toLocaleTimeString();
//   constructor(private loops: LoopsSidebar) {}

//   provObserver(graph: ProvenanceGraph<EventType, IApplicationExtra> | undefined, change: string | undefined) {
//     if (!this.enabled) {
//       console.log('ignore event');
//       return;
//     }

//     console.log(
//       this.created,
//       '*********** StateLists global observer fires 🔥🔥🔥🔥',
//       change,
//       Object.keys(graph?.nodes ?? {}).length
//     );

//     this.loops.update();
//   }
// }
