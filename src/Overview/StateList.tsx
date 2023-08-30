import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { createStyles } from '@mantine/core';
import { Nodes, StateNode, isStateNode } from '@trrack/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { notebookModelCache } from '..';
import { State } from './State';
import { NotebookProvenance } from '../Provenance/JupyterListener';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateList: {
    flexGrow: 1, // grow in vertical direction to fill parent

    // use flex layout to arrange individual states from right to left
    display: 'flex',
    flexDirection: 'row', // arrange child elements horizontally
    alignItems: 'stretch', // stretch child elements to fill the state list vertically

    overflowY: 'hidden', // hide overflow in vertical direction
    // The child elements will have scrollbars if needed

    label: 'state-list'
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

  // const stateListRef = useRef<HTMLDivElement | null>(null);
  // // Scroll the container to the very right after component creation
  // useEffect(() => {
  //   if (stateListRef.current) {
  //     stateListRef.current.scrollLeft = stateListRef.current.scrollWidth;
  //   }
  // }, [notebook, stateListRef.current]);

  const stateListRef = useCallback(node => {
    if (node !== null) {
      console.log('guffelo');
      node.scrollLeft = node.scrollWidth;
    }
  }, []);

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

  // search for node upwards in the tree
  const states: JSX.Element[] = Object.values(trrack.graph.backend.nodes)
    .filter((node): node is StateNode<any, any> => isStateNode(node))
    .sort((nodeA, nodeB) => nodeA.createdOn - nodeB.createdOn) //oldest first, newest last
    // .slice(0, -1) // remove last element (current state)
    .map(node => ({ node, state: trrack.getState(node) }))
    // group all states where the change index >= current index in an array
    .reduce((acc, { node, state }, i, array) => {
      const date = new Date(node.createdOn).toISOString();
      // console.log('kept', 'node', i, date, node.id);

      // set DoI to 1 if most recent state, otherwise 0
      const stateDoI = i === array.length - 1 ? 1 : 0; // most recent

      const previousState = i - 1 >= 0 ? array[i - 1].state : undefined;
      const previousChangeIndex = previousState ? previousState.activeCellIndex : undefined;
      const changeIndex = state.activeCellIndex;
      // console.log('changeIndex', changeIndex, 'previousChangeIndex', previousChangeIndex);

      if (previousChangeIndex !== undefined && changeIndex >= previousChangeIndex) {
        // still linear execution, add to array of current aggregate state
        acc[acc.length - 1].push({ node, state, stateNo: i, stateDoI });
      } else {
        // non-linear execution, start new aggregate state
        acc.push([{ node, state, stateNo: i, stateDoI }]);
      }
      return acc;
    }, [] as { node: StateNode<any, any>; state: NotebookProvenance; stateNo: number; stateDoI: number }[][])
    .map((aggregatedState, i, aggregatedStatesArray) => {
      const previousAggregatedState = i - 1 >= 0 ? aggregatedStatesArray[i - 1] : undefined;
      const previousLastState = previousAggregatedState?.at(-1)?.state;
      const thisLastState = aggregatedState.at(-1);

      if (thisLastState === undefined) {
        throw new Error('there is no state, this should not happen');
      }

      //create a map of cell Ids to execution counts
      const cellExecutionCounts = new Map<string, number>();
      thisLastState.state.cells.forEach(cell => cellExecutionCounts.set(cell.id, 0));

      // go through all states of the aggreggated state and each cell,
      // store how often it was active (i.e., executed) as execution count in the last state
      aggregatedState.forEach(({ state }) => {
        state.cells.forEach(cell => {
          if (cell.active && cellExecutionCounts.has(cell.id)) {
            const count = cellExecutionCounts.get(cell.id) ?? 0;
            cellExecutionCounts.set(cell.id, 1 + count);
          }
        });
      });

      return (
        <State
          key={thisLastState.node.id}
          state={thisLastState.state}
          previousState={previousLastState}
          previousStateNo={previousAggregatedState?.at(-1)?.stateNo}
          previousStateTimestamp={
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            previousAggregatedState?.at(-1) ? new Date(previousAggregatedState.at(-1)!.node.createdOn) : undefined
          }
          stateNo={thisLastState.stateNo}
          stateDoI={thisLastState.stateDoI}
          cellExecutionCounts={cellExecutionCounts}
          timestamp={new Date(thisLastState.node.createdOn)}
          numStates={aggregatedState.length}
          nbTracker={nbTracker}
        />
        // <AggState
        //   key={i}
        //   states={states}
        //   stateNo={states[0].stateNo}
        //   fullWidth={states[0].fullWidth}
        //   previousState={states[states.length - 1][0].state}
        // />
      );
    });

  return (
    <div ref={stateListRef} className={classes.stateList}>
      {states}
    </div>
  );
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
function isGraphEmpty(nodes: Nodes<NotebookProvenance, string>): boolean {
  return Object.keys(nodes).length <= 1; //first node is root node
}
