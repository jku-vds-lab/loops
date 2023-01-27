import { ProvenanceNode, StateNode } from '@visdesignlab/trrack';
import React, { useContext } from 'react';
import {
  EventType,
  IApplicationExtra,
  IApplicationState
} from '../Provenance/notebook-provenance';
import { CodeCellDiff } from './Diffs/CodeCellDiff';
import { createStyles } from '@mantine/core';
import { JupyterProvenanceContext } from './Overview';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateWrapper: {
    // empty space filling wrapper with small padding (for border of state)
    height: '100%',
    minWidth: '100%',
    padding: '0.5rem'
  },
  state: {
    // slight margin and border around state
    // border: '1px solid #ccc',
    // borderRadius: '0.5rem',

    //make sure that the width and height of the parent container are note exceeded by the border
    // boxSizing: 'border-box',

    height: '100%'

    // the state itself uses a flex layout to arrange its elements
    // display: 'flex',
    // flexDirection: 'column'
  }
}));

interface IStateProps {
  node: ProvenanceNode<EventType, IApplicationExtra>;
  stateNo: number;
}

export function State({ node, stateNo }: IStateProps): JSX.Element {
  const { classes } = useStyles();
  const notebookProvenance = useContext(JupyterProvenanceContext);

  const nodeId = node.id;
  const state = notebookProvenance?.getState(nodeId);
  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const { model, activeCell } = state;
  const cells = model.cells.map((cell, i) => {
    return (
      <CodeCellDiff
        key={cell.id}
        content={cell.source}
        active={activeCell === i}
      />
    );
  });
  return (
    <div className={classes.stateWrapper}>
      <div className={classes.state}>{cells}</div>
    </div>
  );
}
