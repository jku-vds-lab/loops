import React, { useContext, useState } from 'react';
import { notebookModelCache } from '..';
import { State } from './State';
import {
  Notebook,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import {
  EventType,
  IApplicationExtra,
  IApplicationState,
  NotebookProvenance
} from '../Provenance/notebook-provenance';
import { isChildNode, Provenance } from '@visdesignlab/trrack';
import { createStyles } from '@mantine/core';
import { JupyterProvenanceContext } from './Overview';

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
  notebook?: Notebook;
}

// TODO fade if not visible
export function StateList({ notebook }: IStateListProps): JSX.Element {
  const { classes } = useStyles();
  const notebookProvenance = useContext(JupyterProvenanceContext);

  if (!notebook || !notebookProvenance) {
    return (
      <main className="stateList">
        <p>Open a notebook to start</p>
      </main>
    );
  }
  const currentState = notebookProvenance.state;
  console.log(
    'cells',
    currentState.model.cells,
    "active cell's id",
    currentState.activeCell
  );
  const {
    id, // id in provenance graph
    label, // label in graph visualization of legacy extension
    actionType, // regular or ephemeral -- unknown when which is used
    metadata
  } = notebookProvenance.current;
  console.log('current state', id, label, actionType, metadata);

  // search for node upwards in the tree
  let node = notebookProvenance.graph.nodes[id];
  let state = 0;
  const states: JSX.Element[] = [];
  while (isChildNode(node)) {
    node = notebookProvenance.graph.nodes[node.parent];
    console.log('state', state, node.label, node.id);
    state++;
    states.push(<State key={node.id} node={node} stateNo={state} />);
  }

  return <main className={classes.stateList}>{states}</main>;
}
