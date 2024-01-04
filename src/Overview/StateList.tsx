import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { createStyles } from '@mantine/core';
import { Nodes, StateNode, isStateNode } from '@trrack/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { notebookModelCache } from '..';
import { State } from './State';
import { NotebookProvenance } from '../Provenance/JupyterListener';
import { useLoopsStore } from '../LoopsStore';
import { LoopsActiveCellMetaDataKey, LoopsStateMetaDataKey, LoopsUserMetaDataKey } from '../Provenance/NotebookTrrack';
import { User } from '@jupyterlab/services';

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
  let step = 'filter nodes';
  console.time(step);

  // search for node upwards in the tree
  const nodeFiltered = Object.values(trrack.graph.backend.nodes).filter((node, i, arr): node is StateNode<any, any> => {
    return isStateNode(node);
  });

  // filter nodeFiltered array to only contain elements that preceeed a node with node.meta.isState === true

  console.timeEnd(step);
  step = 'sort states';
  console.time(step);

  const statesSorted = nodeFiltered.sort((nodeA, nodeB) => nodeA.createdOn - nodeB.createdOn); //oldest first, newest last

  console.timeEnd(step);
  step = 'reduce states';
  console.time(step);

  const users = new Set<string>();

  // search for node upwards in the tree
  const statesFiltered = statesSorted.reduce((acc, node, i, arr) => {
    let pushNode = false;

    // keep the last node if it is a state (most recent change)
    if (i === arr.length - 1) {
      pushNode = true;
    } else {
      // keep the node if it preceeds a state node that has a loops-state metadata
      const nextNode = arr[i + 1]; // out of bounds can not happen because of the if above
      if (nextNode && isStateNode(nextNode)) {
        // check if nextNode.meta has a loops-state property
        if (nextNode.meta[LoopsStateMetaDataKey]) {
          // get the loops-state meta data
          const nextMetaData = nextNode.meta[LoopsStateMetaDataKey];
          const nextLoopsState = (nextMetaData as any)[0].val;
          // TODO make it configurable which loops-state values should be kept
          if (Array.isArray(nextLoopsState) && nextLoopsState.length > 0) {
            pushNode = true;
          }
        }
      }
    }
    if (pushNode) {
      // node will be kept
      // 1. get state
      const state = trrack.getState(node);
      const stateNo = i;
      // 2. get cell execution counts
      // 2.1. intiialize map with all cells present in the last state
      const cellExecutions = new Map<string, { count: number; user: User.IIdentity[] }>();
      state.cells.forEach(cell => cellExecutions.set(cell.id, { count: 0, user: [] }));
      // 2.2 iterate over arr until last kept node (stored in acc)
      const lastStateNo = (acc.at(-1)?.stateNo ?? -1) + 1;
      for (let j = lastStateNo; j <= i; j++) {
        const prevNode = arr[j];

        // get active cell from meta data to avoid reading every state
        const prevActiveCellMetaData = prevNode.meta[LoopsActiveCellMetaDataKey];
        const activeCellId = (prevActiveCellMetaData as any)[0].val;

        // get user from meta data
        const prevUserMetaDta = prevNode.meta[LoopsUserMetaDataKey];
        const userData = (prevUserMetaDta as any)[0].val as User.IIdentity;

        const cellExecData = cellExecutions.get(activeCellId);
        if (cellExecData !== undefined) {
          cellExecutions.set(activeCellId, {
            ...cellExecData,
            count: 1 + cellExecData.count,
            user: [...cellExecData.user, userData]
          });
          users.add(userData.username);
        }
      }

      acc.push({ node, state, stateNo, cellExecutions });
    }
    return acc;
  }, [] as { node: StateNode<any, any>; state: NotebookProvenance; stateNo: number; cellExecutions: Map<string, { count: number; user: User.IIdentity[] }> }[]);

  console.timeEnd(step);
  step = 'create states';
  console.time(step);

  const states = statesFiltered.map((state, i, statesArray) => {
    const previousLastState = i - 1 >= 0 ? statesArray[i - 1].state : undefined;
    const thisLastState = state;

    //create a map of cell Ids to execution counts

    const previousStateNo = i - 1 >= 0 ? statesArray[i - 1].stateNo : undefined;

    return (
      <State
        key={thisLastState.node.id}
        state={thisLastState.state}
        previousState={previousLastState}
        previousStateNo={previousStateNo}
        previousStateTimestamp={thisLastState ? new Date(thisLastState.node.createdOn) : undefined}
        stateNo={thisLastState.stateNo}
        stateDoI={i === statesArray.length - 1 ? 1 : 0}
        cellExecutions={thisLastState.cellExecutions}
        timestamp={new Date(thisLastState.node.createdOn)}
        numStates={thisLastState.stateNo - (previousStateNo ?? -1)} // -1 to include index 0 (otherwise the first aggregated state has wrong count)
        nbTracker={nbTracker}
        handleScroll={updateLines}
        multiUser={users.size > 1}
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
