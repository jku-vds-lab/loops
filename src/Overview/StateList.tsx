import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { createStyles } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { notebookModelCache } from '..';
import { State } from './State';
import { Nodes, ProvenanceGraphStore } from '@trrack/core';
import { TrrackState } from '../Provenance/NotebookTrrack';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateList: {
    // use flex layout to arrange individual states from right to left
    flexGrow: 1,
    overflowX: 'auto',
    overflowY: 'auto',

    display: 'flex',
    flexDirection: 'row-reverse'

    // backgroundColor: '#F37683'
  }
}));

interface IStateListProps {
  nbTracker: INotebookTracker;
  labShell: ILabShell;
}

export function StateList({ nbTracker, labShell }: IStateListProps): JSX.Element {
  console.log('=============== render StateList ===============');

  const { classes } = useStyles();
  const [notebook, setNotebook] = useState(() => {
    console.log('~~~~~~~~~~~~~~~~ set notebook ~~~~~~~~~~~~~~~~');
    const notebok = nbTracker.currentWidget?.isVisible ?? false ? nbTracker.currentWidget?.content : undefined;
    console.log('notebook', notebok);
    return notebok;
  });

  const trrack = notebook ? notebookModelCache.get(notebook)?.trrack : undefined;

  // update the notebook when the current notebook changes
  // Note: only switching between notebooks is handled (i.e., no event is fired when you switch to a different (e.g., csv) file)
  useEffect(() => {
    const handleNotebookChange = (sender: INotebookTracker, notebookEditor: NotebookPanel | null): void => {
      setNotebook(notebookEditor?.content);
    };

    nbTracker.currentChanged.connect(handleNotebookChange);
    return () => {
      nbTracker.currentChanged.disconnect(handleNotebookChange); // remove listener when component is unmounted
    };
  }, [nbTracker]);

  // update the notebook when the focussed file changes
  // handle changes to other files so that the UI is updated if you switch to a different (e.g., csv) file - and then back to a notebook
  // the INotebookTracker above still has the last used Notebook as "currentWidget", so we need this listener to update the sidebar when no notebok is focused
  // drawback: both listeners are fired when you switch between notebooks, so the sidebar is updated twice
  useEffect(() => {
    const handleFocusChange = (sender: ILabShell, labShellArgs: ILabShell.IChangedArgs): void => {
      // if you close a tab and a notebook tab becomes focussed, then this event is fired, but the notebook is not yet visible
      // //const visible = nbTracker.currentWidget?.isVisible ?? false;
      // therefore check if the new widget has the same id as the nbTracker current widget
      if (labShellArgs.newValue?.id === nbTracker.currentWidget?.id) {
        setNotebook(nbTracker.currentWidget?.content);
      } else {
        setNotebook(undefined);
      }
    };

    labShell.currentChanged.connect(handleFocusChange);
    return () => {
      labShell.currentChanged.disconnect(handleFocusChange); // remove listener when component is unmounted
    };
  }, [labShell]);

  if (!notebook) {
    return displayMissingNotebookHint(classes.stateList);
  } else if (!trrack || isGraphEmpty(trrack.graph.backend.nodes)) {
    return displayMissingProvenanceHint(classes.stateList);
  }

  const {
    id, // id in provenance graph
    label, // label in graph visualization of legacy extension
    // actionType, // regular or ephemeral -- unknown when which is used
    meta
  } = trrack?.graph.current;

  // search for node upwards in the tree
  let node = trrack.graph.backend.nodes[id];
  let state = Object.keys(trrack.graph.backend.nodes).length;
  const states: JSX.Element[] = [];
  while ('parent' in node) {
    console.log('state', state, node.label, node.id);
    state--;
    states.push(<State key={node.id} node={node} stateNo={state} notebookTrrack={trrack} />);
    node = trrack.graph.backend.nodes[node.parent];
  }

  return <main className={classes.stateList}>{states}</main>;
}

function displayMissingNotebookHint(style: string): JSX.Element {
  return (
    <main className={style}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <h1 style={{ textAlign: 'center' }}>⚠️</h1>
        <p style={{ textAlign: 'center' }}>History is only available for notebooks</p>
      </div>
    </main>
  );
}

function displayMissingProvenanceHint(style: string): JSX.Element {
  return (
    <main className={style}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <h1 style={{ textAlign: 'center' }}>🧑‍💻</h1>
        <p style={{ textAlign: 'center' }}>No provenance yet.</p>{' '}
        <p style={{ textAlign: 'center' }}>Update or execute some cells to start tracking your notebook's history.</p>
      </div>
    </main>
  );
}
function isGraphEmpty(nodes: Nodes<TrrackState, string>): boolean {
  return Object.keys(nodes).length <= 1; //first node is root node
}
