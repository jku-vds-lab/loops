// based on https://github.com/mkery/Verdant

import { PathExt } from '@jupyterlab/coreutils';
import { Contents } from '@jupyterlab/services';

export class FileManager {
  private test_mode: boolean;
  private contentsManager: Contents.IManager;
  private _activeNotebookPath: string;

  constructor(contentsMananger: Contents.IManager, test = false) {
    this.test_mode = test;
    this.contentsManager = contentsMananger;
  }

  public set activeNotebookPath(path: string) {
    // console.log('Setting active notebook path to', path);
    this._activeNotebookPath = path;
  }

  public writeToFile(trackExport: string): Promise<void> {
    if (this.test_mode) {
      // return resolved promise
      return Promise.resolve();
    }

    return new Promise((accept, reject) => {
      const notebookPath = this._activeNotebookPath;
      if (notebookPath) {
        //log("notebook path is", notebookPath)
        let name = PathExt.basename(notebookPath);
        name = name.substring(0, name.indexOf('.')) + '.trrack.json';
        //log("name is", name)
        const path = '/' + notebookPath.substring(0, notebookPath.lastIndexOf('/') + 1) + name;
        //log("goal path is ", path)

        this.contentsManager
          .save(path, {
            type: 'file',
            format: 'text',
            content: trackExport
          })
          .then(() => {
            console.log('Model written to file', path);
            accept();
          })
          .catch(rej => {
            //here when you reject the promise if the filesave fails
            console.error(rej);
            accept();
          });
      } else {
        console.error('Failed to find valid notebook path to save history to!');
        accept();
      }
    });
  }

  public loadFromFile(): Promise<any> {
    return new Promise(accept => {
      const notebookPath = this._activeNotebookPath;
      if (notebookPath) {
        //log("notebook path is", notebookPath)
        let name = PathExt.basename(notebookPath);
        name = name.substring(0, name.lastIndexOf('.')) + '.trrack.json';
        //log("name is", name)
        const path = '/' + notebookPath.substring(0, notebookPath.lastIndexOf('/') + 1) + name;
        this.contentsManager
          .get(path)
          .then(res => {
            // console.log('Found a model ', res);
            accept(res.content);
          })
          .catch(() => {
            console.error('No model found');
            accept(null);
          });
      } else {
        console.error('Unable to find valid notebook path to load history from.');
        accept(null);
      }
    });
  }
}
