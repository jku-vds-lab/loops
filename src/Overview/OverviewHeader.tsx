import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import React, { useEffect, useState } from 'react';
import { LoopsLogo } from '../assets/loops-logo';

interface IOverviewHeaderProps {
  nbTracker: INotebookTracker;
  labShell: ILabShell;
}
// TODO fade if not visible
export function OverviewHeader({
  nbTracker,
  labShell
}: IOverviewHeaderProps): JSX.Element {
  const [notebookTitle, setNotebookTitle] = useState<string>(
    nbTracker.currentWidget?.content.title.label ?? 'None'
  );

  const [notebookVisible, setNotebookVisible] = useState<boolean>(
    nbTracker.currentWidget?.isVisible ?? false
  );

  useEffect(() => {
    const handleNotebookChange = (
      sender: INotebookTracker,
      notebookEditor: NotebookPanel | null
    ): void => {
      setNotebookTitle(notebookEditor?.content.title.label ?? 'None');

      console.log('visible', notebookEditor?.isVisible ?? false);
      setNotebookVisible(notebookEditor?.isVisible ?? false);
    };

    nbTracker.currentChanged.connect(handleNotebookChange);
    return () => {
      nbTracker.currentChanged.disconnect(handleNotebookChange);
    };
  }, [nbTracker]);

  useEffect(() => {
    const handleFocusChange = (
      sender: ILabShell,
      labShellArgs: ILabShell.IChangedArgs
    ): void => {
      const visible = nbTracker.currentWidget?.isVisible ?? false;
      setNotebookVisible(visible);
    };

    labShell.currentChanged.connect(handleFocusChange);
    return () => {
      labShell.currentChanged.disconnect(handleFocusChange);
    };
  }, [labShell]);

  return (
    <header className="loops-header">
      <div className="title">
        <LoopsLogo height={30} />
      </div>
      <p>{notebookVisible ? notebookTitle : 'Not a notebook'}</p>
    </header>
  );
}
