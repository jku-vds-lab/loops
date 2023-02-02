import { MultilineString } from '@jupyterlab/nbformat';
import { createStyles } from '@mantine/core';
import { Provenance, ProvenanceNode } from '@visdesignlab/trrack';
import React from 'react';
import {
  EventType,
  IApplicationExtra,
  IApplicationState
} from '../Provenance/notebook-provenance';
import { CodeCellDiff } from './Diffs/CodeCellDiff';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateWrapper: {
    // empty space filling wrapper with small padding (for border of state)
    height: '100%',
    padding: '0.5rem',

    // start of with full width
    flexBasis: '100%',
    maxWidth: '20rem' // limit the width to 20rem so you can also see other states when you expand
  },
  currentState: {
    flexShrink: 0 //dont shrink, because then they will collapse as much as possible
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
  notebookProvenance: Provenance<
    IApplicationState,
    EventType,
    IApplicationExtra
  >;
}

export function State({
  node,
  stateNo,
  notebookProvenance
}: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  const nodeId = node.id;
  const state = notebookProvenance?.getState(nodeId);
  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const isThisTheCurrentState: boolean =
    nodeId === notebookProvenance.current.id;

  const { model, activeCell } = state;
  const cells = model.cells.map((cell, i) => {
    return (
      // check type of cell: code cells have output; markdown cells don't - check type and cast appropriatly
      <>
        <CodeCellDiff key={cell.id} active={activeCell === i}>
          {isThisTheCurrentState ? formatChildren(cell.source) : <>&nbsp;</>}
        </CodeCellDiff>
        <CodeCellDiff key={cell.id} active={activeCell === i}>
          {isThisTheCurrentState ? formatOutputs(cell.outputs) : <>&nbsp;</>}
        </CodeCellDiff>
      </>
    );
  });
  return (
    <div
      className={cx(classes.stateWrapper, 'stateWrapper', {
        [classes.currentState]: isThisTheCurrentState === true
      })}
    >
      <div className={classes.state}>
        {cells}
        <p></p>
        <hr></hr>
        <div>v{stateNo}</div>
      </div>
    </div>
  );
}

function formatChildren(source: MultilineString): JSX.Element {
  if (source === undefined || source === '') {
    return <>&nbsp;</>;
  } else if (Array.isArray(source)) {
    return <>{source.join('\n')}</>;
  }

  return <>{source}</>;
}

function formatOutputs(outputs: any | undefined): JSX.Element {
  if (Array.isArray(outputs)) {
    return <>{outputs.map((output, i) => formatOutputs(output))}</>;
  } else if (outputs.data && outputs.data?.['text/plain']) {
    //direct output
    if (Array.isArray(outputs.data?.['text/plain'])) {
      return <>{outputs.data?.['text/plain'].join('\n')}</>;
    } else {
      return <>{outputs.data?.['text/plain']}</>;
    }
  } else if (outputs.text) {
    console.log(outputs.text, 'text');
    //print output
    return <>{outputs.text}</>;
  }
  return <></>;
}
