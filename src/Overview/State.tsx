import { MultilineString } from '@jupyterlab/nbformat';
import { createStyles } from '@mantine/core';
import React from 'react';
import { CodeCellDiff } from './Diffs/CodeCellDiff';
import { ProvenanceNode, Trrack } from '@trrack/core';
import { TrrackState } from '../Provenance/NotebookTrrack';

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
  node: ProvenanceNode<TrrackState, string>;
  stateNo: number;
  notebookTrrack: Trrack<TrrackState, string>;
}

export function State({ node, stateNo, notebookTrrack }: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  const nodeId = node.id;
  const nodeee = notebookTrrack?.graph.backend.nodes[nodeId];
  const state = notebookTrrack?.getState(nodeee);
  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const isThisTheCurrentState: boolean = nodeId === notebookTrrack.current.id;

  const { notebookModel, activeCell } = state;

  const cells: JSX.Element[] = [];
  for (let i = 0; notebookModel && i < notebookModel.cells.length; i++) {
    const cell = notebookModel.cells.get(i);
    cells.push(
      <>
        <CodeCellDiff key={cell.id} active={activeCell === i}>
          {isThisTheCurrentState ? formatChildren(cell.value.text) : <>&nbsp;</>}
        </CodeCellDiff>
        {/* <CodeCellDiff key={cell.id} active={activeCell === i}>
          {isThisTheCurrentState ? formatOutputs(cell) : <>&nbsp;</>}
        </CodeCellDiff> */}
      </>
    );
  }

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
