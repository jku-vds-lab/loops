import { ILabShell, ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { LoopsSidebar } from './Overview/LoopsSidebar';
import { FileManager } from './Provenance/FileManager';
import { NotebookTrrack } from './Provenance/NotebookTrrack';
import { loopsLabIcon } from './loopsLabIcon';
import { useLoopsStore } from './LoopsStore';

// Storage of notebooks and their trrack provenance
export const notebookModelCache = new Map<Notebook, NotebookTrrack>();

function activate(
  app: JupyterFrontEnd,
  nbTracker: INotebookTracker,
  labShell: ILabShell,
  settingRegistry: ISettingRegistry | null,
  restorer: ILayoutRestorer | null
): void {
  console.clear();
  console.debug('Activate JupyterLab extension: loops');

  // nbTracker.widgetAdded.connect((sender, nb) => {
  //   // new tabs that are being added
  //   console.info('widget added', nb);
  // });

  if (settingRegistry) {
    settingRegistry
      .load(plugin.id)
      .then(settings => {
        console.debug('loops settings loaded:', settings.composite);
      })
      .catch(reason => {
        console.warn('Failed to load settings for loops.', reason);
      });
  }

  const loops = new LoopsSidebar(app, nbTracker, labShell);

  const fileManager = new FileManager(app.serviceManager.contents, false);

  if (nbTracker) {
    console.debug('connect to notebook tracker');
    nbTracker.currentChanged.connect((sender, notebookEditor) => {
      // called when the current notebook changes
      // only tracks notebooks! not other files or tabs
      console.info('notebook changed. New Notebook:', notebookEditor?.title.label);
      useLoopsStore.getState().clearStateData(); // clear the state data when the notebook changes
      if (notebookEditor) {
        //testEventHandlers(notebookEditor);
        notebookEditor.sessionContext.ready.then(() => {
          console.debug(notebookEditor.title.label, 'session ready');
          const notebook: Notebook = notebookEditor.content;
          fileManager.activeNotebookPath = notebookEditor.context.path;

          // add the notebook to the cache if necessary
          if (!notebookModelCache.has(notebook)) {
            // identity:  https://jupyterlab.readthedocs.io/en/4.0.x/extension/identity.html
            const provenance = new NotebookTrrack(notebook, fileManager, app.serviceManager.user.identity ?? undefined);
            notebookModelCache.set(notebook, provenance);

            const unsubscribe = provenance.trrack.currentChange(trigger => {
              console.log('⭐ update UI by provenance change', trigger);
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

            // save the provenance when the notebook is saved
            notebookEditor.context.saveState.connect((context, saveState) => {
              if (saveState === 'completed') {
                // store only when notebook is stored succesfully
                provenance.saveProv();
              }
            });
          }

          // disable all observer in the cache and enable the observer for the current notebook
          notebookModelCache.forEach((observer, cacheNotebook) => {
            // console.log('enable?????', notebook.id === cacheNotebook.id);
            observer.enabled = notebook.id === cacheNotebook.id;
          });

          // update the UI
          // console.log('⭐ update UI'); // not necessary, trrack will fire the event when the prov is laoded from file
          // loops.update(); //update because the Provenance might not have been available wehn it was rendered first

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
  id: 'loops-diff:plugin',
  description: 'A JupyterLab extension to support iterative and exploratory data analysis in computational notebooks.',
  autoStart: true,
  activate,
  requires: [INotebookTracker, ILabShell],
  optional: [ISettingRegistry, ILayoutRestorer]
};

export default plugin;

// different event handlers that can be used to track the notebook, keep for reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testEventHandlers(nb: NotebookPanel) {
  // const model = nb.model;
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
