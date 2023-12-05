import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { createStyles } from '@mantine/core';
import { Nodes, StateNode, isStateNode } from '@trrack/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { notebookModelCache } from '..';
import { State } from './State';
import { NotebookProvenance } from '../Provenance/JupyterListener';
import { useLoopsStore } from '../LoopsStore';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateList: {
    flexGrow: 1, // grow in vertical direction to fill parent

    // use flex layout to arrange individual states from right to left
    display: 'flex',
    flexDirection: 'row', // arrange child elements horizontally
    alignItems: 'stretch', // stretch child elements to fill the state list vertically

    overflowY: 'hidden', // hide overflow in vertical direction
    // The child elements will have scrollbars if needed

    // to absolute position the connecting lines
    position: 'relative',

    label: 'state-list'
  },
  line: {
    position: 'absolute',
    backgroundColor: 'var(--md-grey-300)',
    transformOrigin: '0 50%',
    height: '1px'
  }
}));

interface IStateListProps {
  nbTracker: INotebookTracker;
  labShell: ILabShell;
}

export function StateList({ nbTracker, labShell }: IStateListProps): JSX.Element {
  console.debug('=============== render StateList ===============');

  const { classes } = useStyles();
  const [notebook, setNotebook] = useState(() => {
    console.debug('~~~~~~~~~~~~~~~~ set notebook ~~~~~~~~~~~~~~~~');
    const notebok = nbTracker.currentWidget?.isVisible ?? false ? nbTracker.currentWidget?.content : undefined;
    console.debug('new loops notebook', notebok);
    return notebok;
  });
  const setActiveCell = useLoopsStore(state => state.setActiveCell);

  // Lines connecting the cells
  const [lines, setLines] = useState<JSX.Element[]>([]); // Initialize state with empty array

  const trrack = notebook ? notebookModelCache.get(notebook)?.trrack : undefined;

  // update the notebook when the current notebook changes
  // Note: only switching between notebooks is handled (i.e., no event is fired when you switch to a different (e.g., csv) file)
  useEffect(() => {
    const handleNotebookChange = (sender: INotebookTracker, notebookEditor: NotebookPanel | null): void => {
      setNotebook(notebookEditor?.content);
      const activeCell = notebookEditor?.content?.activeCell;
      setActiveCell(activeCell?.model.id, activeCell?.node.getBoundingClientRect().top);
    };

    nbTracker.currentChanged.connect(handleNotebookChange);
    return () => {
      nbTracker.currentChanged.disconnect(handleNotebookChange); // remove listener when component is unmounted
    };
  }, [nbTracker]);

  const updateLines = stateNo => {
    console.debug('update lines', stateNo);
    const boundingClientRect = document.getElementById('Statelist')?.getBoundingClientRect();
    console.log('boundingClientRect', boundingClientRect);
    if (!boundingClientRect) {
      return;
    }

    //remove all lines by initializing the array with an empty array
    const newLines: JSX.Element[] = [];

    const cells = document.querySelectorAll('#DiffOverview .jp-Cell');

    // Loop through the items
    cells.forEach(item => {
      const id = item.getAttribute('data-cell-id');
      const matchingCells = document.querySelectorAll(`#DiffOverview .jp-Cell[data-cell-id="${id}"]`);

      // Loop through matching items and create lines
      matchingCells.forEach(matchingItem => {
        if (matchingItem !== item) {
          const itemRect = item.getBoundingClientRect();
          const matchingItemRect = matchingItem.getBoundingClientRect();

          // Calculate the width based on horizontal distance
          const width = matchingItemRect.left - itemRect.right;

          if (width > 0 && width < 30) {
            // Calculate the height based on vertical offset
            const height = matchingItemRect.top - itemRect.top;

            // Calculate the angle of the line
            const angle = Math.atan2(height, width);

            // Calculate the length of the line
            const length = Math.sqrt(width * width + height * height);

            // Calculate the top position for the line to start from the center
            const top = itemRect.top - boundingClientRect.top + window.scrollY + itemRect.height / 2;

            newLines.push(
              <div
                className={classes.line}
                style={{
                  top: `${top}px`,
                  left: `${itemRect.right - boundingClientRect.left}px`,
                  width: `${length}px`,
                  transform: `rotate(${angle}rad)`
                }}
              ></div>
            );
          }
        }
      });
    });
    setLines(newLines);
  };

  // Scroll the container to the very right (most recent).
  // useCallback instead of useEffect because ref.current was null in useEffect
  // React will call that callback whenever the ref gets attached to a different node.
  // also see: https://stackoverflow.com/a/63033314/2549748
  const stateListRef = useCallback(node => {
    if (node !== null) {
      // console.log('scroll to state by callback');
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
        const activeCell = nbTracker.currentWidget?.content.activeCell;
        setActiveCell(activeCell?.model.id, activeCell?.node.getBoundingClientRect().top);
      } else {
        setNotebook(undefined);
        setActiveCell(undefined, undefined);
      }
    };

    labShell.currentChanged.connect(handleFocusChange);
    return () => {
      labShell.currentChanged.disconnect(handleFocusChange); // remove listener when component is unmounted
    };
  }, [labShell]);

  if (!notebook) {
    console.debug('no notebook');
    return displayMissingNotebookHint(classes.stateList);
  } else if (!trrack || isGraphEmpty(trrack.graph.backend.nodes)) {
    console.debug('no provenance');
    return displayMissingProvenanceHint(classes.stateList);
  }

  console.time('create states total');
  let step = 'filter states';
  console.time(step);

  // search for node upwards in the tree
  const statesFiltered = Object.values(trrack.graph.backend.nodes).filter(
    (node, i, arr): node is StateNode<any, any> => {
      return isStateNode(node);
    }
  );

  console.timeEnd(step);
  step = 'sort states';
  console.time(step);

  const statesSorted = statesFiltered.sort((nodeA, nodeB) => nodeA.createdOn - nodeB.createdOn); //oldest first, newest last

  console.timeEnd(step);
  step = 'map states';
  console.time(step);

  const statesMapped = statesSorted
    // .slice(0, -1) // remove last element (current state)
    .map((node, i, arr) => {
      return { node, state: trrack.getState(node) };
    });

  console.timeEnd(step);
  step = 'reduce states';
  console.time(step);

  const statesReduced = statesMapped
    // group all states where the change index >= current index in an array
    .reduce((acc, { node, state }, i, array) => {
      // set DoI to 1 if most recent state, otherwise 0
      const stateDoI = i === array.length - 1 ? 1 : 0; // most recent

      const previousState = i - 1 >= 0 ? array[i - 1].state : undefined;
      const previousChangeIndex = previousState ? previousState.activeCellIndex : undefined;
      const changeIndex = state.activeCellIndex;

      if (previousChangeIndex !== undefined && changeIndex >= previousChangeIndex) {
        // still linear execution, add to array of current aggregate state
        acc[acc.length - 1].push({ node, state, stateNo: i, stateDoI });
      } else {
        // non-linear execution, start new aggregate state
        acc.push([{ node, state, stateNo: i, stateDoI }]);
      }
      return acc;
    }, [] as { node: StateNode<any, any>; state: NotebookProvenance; stateNo: number; stateDoI: number }[][]);

  console.timeEnd(step);
  step = 'create states';
  console.time(step);

  const states = statesReduced.map((aggregatedState, i, aggregatedStatesArray) => {
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
        handleScroll={updateLines}
      />
    );
  });

  console.timeEnd(step);
  console.timeEnd('create states total');
  return (
    <div ref={stateListRef} className={classes.stateList} id="Statelist">
      {states}
      {lines}
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
