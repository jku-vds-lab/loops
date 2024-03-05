import '@armantang/html-diff/dist/index.css';
import '@github/relative-time-element';
import { isMarkdown } from '@jupyterlab/nbformat';
import { INotebookTracker } from '@jupyterlab/notebook';
import { User } from '@jupyterlab/services';
import { ActionIcon, Avatar, Center, Tooltip, createStyles } from '@mantine/core';
import { IconArrowsDiff, IconArrowsHorizontal } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLoopsStore } from '../LoopsStore';
import { NotebookProvenance } from '../Provenance/JupyterListener';
import { getScrollParent, mergeArrays } from '../util';
import { CodeCell } from './Cells/CodeCell';
import { DeletedCell } from './Cells/DeletedCell';
import { MarkdownCell } from './Cells/MarkDownCell';
import { useXarrow } from 'react-xarrows';

const useStyles = createStyles((theme, _params) => ({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)',
    zIndex: 1,
    backgroundColor: 'white'
  },
  stateWrapper: {
    label: 'wrapper',

    overflowY: 'hidden',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',

    // sizing within the state list (Default = compact)
    minWidth: '4rem',
    maxWidth: '4rem',

    '.html-diff-delete-text-wrapper': {
      color: 'black',
      textDecorationColor: 'black',
      backgroundColor: '#F0526877'
    },
    '.html-diff-create-text-wrapper': {
      background: '#66C2A577'
    }
  },
  stateScroller: {
    label: 'scroller',
    overflowY: 'auto',
    paddingRight: '0.75em' // does not work if dashedBorder is enabled (add padding to jp-Cell instead)
  },
  wideState: {
    label: 'wide-state',
    minWidth: '10rem', // keep larger than the compact states
    maxWidth: '20rem', // limit the width to 20rem so you can also see other states when you expand

    '& .jp-Cell': {
      backgroundColor: 'unset',

      '&.deleted': {
        backgroundColor: 'unset'
      },

      '&.added': {
        backgroundColor: 'unset'
      },

      '&.changed': {
        backgroundColor: 'unset'
      },
      '.input, .output': {
        paddingTop: '0.4rem',
        background: 'white',
        borderRadius: '0.5rem'
      },

      '.mycode': {
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        textOverflow: 'clip',
        fontSize: 'var(--jp-code-font-size)',
        overflowX: 'auto'
      }
    }
  },
  state: {
    label: 'state',

    // the state itself uses a flex layout to arrange its elements
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem 0',

    '& .jp-InputArea-editor': {
      // set .jp-InputArea-editor  to block to avoid overflowing the state column horizontally
      display: 'block',
      //background: 'unset',
      border: 'unset'
    },

    '& .jp-Cell': {
      border: '1px solid var(--md-grey-200)',
      padding: '0',
      margin: '0 0.25rem',
      borderRadius: '0.5rem',
      position: 'relative',
      backgroundColor: 'var(--md-grey-200)',
      cursor: 'pointer',

      '.compare-badge': {
        display: 'none'
      },

      '&:hover .compare-badge': {
        display: 'block'
      },

      '& .jp-MarkdownOutput': {
        display: 'block',
        overflow: 'auto',
        whiteSpace: 'nowrap',
        backgroundColor: 'white'
      },

      '&.active': {
        borderWidth: '2px !important',
        boxShadow: '0px 0px 5px 1px var(--jp-brand-color1)'
      },

      '&.deleted': {
        border: '1px solid #F05268',
        backgroundColor: '#F05268'
      },

      '&.added': {
        border: '1px solid #66C2A5',
        backgroundColor: '#66C2A5'
      },

      '&.executed': {
        minHeight: '0.9em' // badge is 0.8em
      },

      '&.changed': {
        border: '1px solid #FBE156',
        backgroundColor: '#FBE156'
      },

      ' .input': {
        // only set border radius on the top (as the input takes the upper half of the cell)
        '& .jp-InputArea-editor': {
          borderRadius: '0.5rem 0.5rem 0 0'
        },

        //if input is the only child, also set bottom radius
        '&:only-child .jp-InputArea-editor': {
          borderRadius: '0.5rem'
        }
      }
    }
  },
  activeSeperator: {
    height: '0.5rem',
    background: 'var(--jp-brand-color1)',
    label: 'active-seperator'
  },
  activeSeperatorTop: {
    marginTop: '0.25rem',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem'
  },
  activeSeperatorBottom: {
    marginBottom: '0.25rem',
    borderBottomLeftRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem'
  },
  '.jp-Cell:not(.active)': {
    // only for non-active cells, hide the content if it hasnt changed
    '.unchanged': {
      '&.transparent *': {
        color: 'transparent'
      }
    }
  },
  versionSplit: {
    label: 'version-split',
    borderTop: '1px solid var(--jp-toolbar-border-color)',
    marginTop: '1em',
    textAlign: 'center',
    zIndex: 1, // higher than the xarrow lines
    backgroundColor: 'white'
  },
  dashedBorder: {
    // borderLeft: 'var(--jp-border-width) dotted var(--jp-toolbar-border-color)',
    //borderRight: 'var(--jp-border-width) dotted var(--jp-toolbar-border-color)'
  },
  tinyHeight: {
    height: '12.8px'
  }
}));

interface IStateProps {
  stateDoI: number;
  state: NotebookProvenance;
  previousState?: NotebookProvenance;
  previousStateNo?: number;
  previousStateTimestamp?: Date;
  stateNo: number;
  cellExecutions: Map<string, { count: number; user: User.IIdentity[] }>;
  timestamp: Date;
  numStates: number;
  nbTracker: INotebookTracker;
  multiUser: boolean;
}

export function State({
  state,
  stateNo,
  previousState,
  previousStateNo,
  previousStateTimestamp,
  stateDoI,
  cellExecutions,
  timestamp,
  numStates,
  nbTracker,
  multiUser
}: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();
  const updateXarrow = useXarrow();

  const [fullWidth, setFullWidth] = useState(stateDoI === 1); // on first render, initialize with stateDoI
  useEffect(() => {
    // update widthon subsequent renders if stateDoI changes
    setFullWidth(stateDoI === 1);
  }, [stateDoI]);
  const toggleFullwidth = () => {
    setFullWidth(!fullWidth);
  };

  const setActiveCell = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    //get cellID from target
    const clickedCell = (e.target as HTMLDivElement).closest('.jp-Cell');
    const cellId = clickedCell?.getAttribute('data-cell-id');
    if (clickedCell && cellId) {
      console.log('clicked cell', cellId);
      //find notebook cell with same ID
      const cells = nbTracker.currentWidget?.content.model?.cells;
      const activeCellIndex = [...(cells ?? [])].findIndex(cell => cell.id === cellId);

      // does notebook have a corresponding cell?
      if (activeCellIndex !== -1 && nbTracker.currentWidget && cells) {
        // Yes, scroll notebook cell and set active
        // 1. scroll notebook

        //distance of clicked Cell to top in visible area
        const provCellClientTop = (clickedCell as HTMLDivElement).getBoundingClientRect().top; // 536

        // the corresponding cell in the notebook
        const cellWidget = nbTracker.currentWidget.content.widgets[activeCellIndex];
        // position of cell in notebook
        const cellWidgetTop = cellWidget.node.offsetTop; //1106
        // the parent element that scrolls the notebook
        const scrollParent = getScrollParent(cellWidget.node);
        // position of scrolling parent in window
        const notebookScrollerClientTop = scrollParent.getBoundingClientRect().top; // 88

        // the notebook cells have some padding at the top that needs to be considered in order to align the cells properly
        const jpCellPadding =
          parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jp-cell-padding')) || 0;

        // scroll to cellWidgetTop
        // would scroll the cell the top of the scrolling parent element's visible area
        // --> scroll a bit less such that the notebook and prov cells are aligned, i.e., subtract provCellClientTop
        // but provCellClientTop is calculated relative to the window, not the notebook scroll container
        // add notebookScrollerClientTop to get the distance of the notebook scroll container to the top of the window (needs to scroll further down to compensate)
        // add cell padding to align the cells properly
        const scrollPos = cellWidgetTop - provCellClientTop + notebookScrollerClientTop + jpCellPadding;
        // const eventType : ElementEventMap = 'scrollend';
        scrollParent.scrollTo({ top: scrollPos, behavior: 'smooth' });
        // 2. set active cell in notebook after scrolling is done
        scrollParent.addEventListener(
          'scrollend',
          () => {
            if (nbTracker.currentWidget) {
              nbTracker.currentWidget.content.activeCellIndex = activeCellIndex;
            }
          },
          { once: true }
        ); // only run once
      }
    }
  };

  const activeCellId = useLoopsStore(state => state.activeCellID);
  // activeCellTop = distance of the notebook's active cell to the top of the window
  const activeCellTop = useLoopsStore(state => state.activeCellTop);
  const stateScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      const scrollToElement = () => {
        // provCellTop = distance of the provenance's corresponding cell to the top of the extension
        // console.log(`state ${stateNo} scroll to active cell ID with top position`, activeCellId, activeCellTop);
        const provCellTop = stateScrollerRef.current?.querySelector<HTMLDivElement>(
          `[data-cell-id="${activeCellId}"]`
        )?.offsetTop;

        const versionSplit = 35;
        // activeCellTop and provCellTop are calculated relative to different elements, align them by adding the height of the top panel
        const jpTopPanelHeight = document.querySelector<HTMLDivElement>('#jp-top-panel')?.offsetHeight || 0;
        // the notebook cells have some padding at the top that needs to be considered in order to align the cells properly
        const jpCellPadding =
          parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jp-cell-padding')) || 0;

        if (activeCellTop && provCellTop) {
          // console.log('scroll to element', activeCellTop, provCellTop, jpTopPanelHeight, jpCellPadding);
          const scrollPos = provCellTop - activeCellTop + jpTopPanelHeight - jpCellPadding + versionSplit;
          // console.log('scrollpos', scrollPos);
          stateScrollerRef.current?.scrollTo({ top: scrollPos, behavior: 'instant' });
        }
      };
      scrollToElement();
    },
    [activeCellId, activeCellTop] //depend on activeCellTop --> run if the value changes
    ////currently: no dependency --> run on every render (at the end of the render cycle)
  );

  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const cellIDs = state.cells.map(cell => cell.id);
  const previousCellIDs = previousState?.cells.map(cell => cell.id);

  const cellIds = mergeArrays(cellIDs, previousCellIDs);

  const cells: JSX.Element[] = cellIds.map((cellId, i) => {
    // cell in current state
    const cell = state.cells.find(cell => cell.id === cellId);
    const isActiveCell = activeCellId === cell?.id;
    // cell in previous state
    const previousCell = previousState?.cells.find(cell => cell.id === cellId);

    if (cell === undefined && previousCell !== undefined) {
      // cell was deleted in current state
      return <DeletedCell key={cellId} cellId={cellId} isActiveCell={isActiveCell} stateNo={stateNo} />;
    } else if (cell === undefined && previousCell === undefined) {
      // cell is in none of the states
      // weird, but nothing to do
      return <></>;
    } else if (cell !== undefined) {
      const executions = cellExecutions.get(cellId)?.count ?? 0;
      // cell was added (previousCell is undefined) or changed (previousCell defined) in current state
      if (isMarkdown(cell.inputModel)) {
        // handle markdown separately
        // different classes for markdown and code cells
        // show output (rendered markdown) instead of input (markdown source)
        //return createMarkdownProvCell(cell, previousCell, isActiveCell, cellId, executions);
        return (
          <MarkdownCell
            key={cellId}
            fullWidth={fullWidth}
            multiUser={multiUser}
            cell={cell}
            cellId={cellId}
            isActiveCell={isActiveCell}
            stateNo={stateNo}
            timestamp={timestamp}
            executions={executions}
            cellExecutions={cellExecutions}
            previousCell={previousCell}
            previousStateNo={previousStateNo}
            previousStateTimestamp={previousStateTimestamp}
            setActiveCell={setActiveCell}
            toggleFullwidth={toggleFullwidth}
          />
        );
      } else {
        return (
          <CodeCell
            key={cellId}
            fullWidth={fullWidth}
            multiUser={multiUser}
            cell={cell}
            cellId={cellId}
            isActiveCell={isActiveCell}
            stateNo={stateNo}
            timestamp={timestamp}
            executions={executions}
            cellExecutions={cellExecutions}
            previousCell={previousCell}
            previousStateNo={previousStateNo}
            previousStateTimestamp={previousStateTimestamp}
            setActiveCell={setActiveCell}
            toggleFullwidth={toggleFullwidth}
          ></CodeCell>
        );
      }
    }
    //else
    return <></>;
  });

  // Get all users of the state and sort by frequency of executions
  const users = new Map<string, { user: User.IIdentity; frequency: number }>();
  // for  each cell
  cellExecutions.forEach((value, key) => {
    // for each user (aggregated state could have multipe users per cell)
    value.user.forEach(user => {
      const freq = users.get(user.username)?.frequency ?? 0;
      users.set(user.username, { user: user, frequency: freq + 1 });
    });
  });
  const sortedUsers = [...users.values()].sort((a, b) => b.frequency - a.frequency);

  let avatars = multiUser
    ? [...sortedUsers.values()].map((user, i) => {
        return (
          <Tooltip label={`${user.user.name} (${user.frequency})`} withArrow>
            <Avatar
              src={user.user.avatar_url as string}
              alt={user.user.name}
              radius="xl"
              size="sm"
              color="dark.1" // dark.0 for cells
              variant="filled"
            >
              {user.user.initials}
            </Avatar>
          </Tooltip>
        );
      })
    : [];

  const maxUsersDisplayedCompact = 3;
  const maxUsersDisplayedFull = 5;
  // truncate avatars if there are more than 3, add a +X badge
  if ((!fullWidth && avatars.length > maxUsersDisplayedCompact) || avatars.length > maxUsersDisplayedFull) {
    // if more than 3/5 show 2/4 avatars and a +X badge (oi.e., replace at least two avatars with the +X badge)
    const maxLength = (fullWidth ? maxUsersDisplayedFull : maxUsersDisplayedCompact) - 1;
    const overflowUsers = sortedUsers
      .slice(maxLength)
      .map(user => `${user.user.name} (${user.frequency})`)
      .join(', ');
    avatars = avatars.slice(0, maxLength);
    avatars.push(
      <Tooltip label={overflowUsers} withArrow multiline width={180}>
        <Avatar radius="xl" size="sm" color="dark.1" variant="filled">
          +{sortedUsers.length - maxLength}
        </Avatar>
      </Tooltip>
    );
  }

  avatars = avatars.reverse(); //show most active last

  return (
    <div
      className={cx(classes.stateWrapper, {
        [classes.wideState]: fullWidth // disable flexShrink if the state is full width
      })}
    >
      <header className={cx(classes.header, classes.dashedBorder)}>
        <Center>
          <ActionIcon onClick={toggleFullwidth} title={fullWidth ? 'collapse' : 'expand'}>
            {fullWidth ? <IconArrowsDiff /> : <IconArrowsHorizontal />}
          </ActionIcon>
        </Center>
      </header>
      <div ref={stateScrollerRef} className={classes.stateScroller} onScroll={updateXarrow}>
        <div className={cx(classes.state, 'state')}>
          <div style={{ height: '100vh' }} className={classes.dashedBorder}></div>
          {cells}
          <div style={{ height: '100vh' }}></div>
        </div>
      </div>
      <div className={cx(classes.versionSplit)}>
        {!fullWidth ? (
          <>
            <div>v{stateNo + 1}</div>
            <Center>
              <Avatar.Group spacing={12}>{avatars}</Avatar.Group>
            </Center>
          </>
        ) : (
          <>
            <div>
              v{stateNo + 1},{' '}
              <relative-time datetime={timestamp.toISOString()} precision="second">
                {timestamp.toLocaleTimeString()} {timestamp.toLocaleDateString()}
              </relative-time>
            </div>
            <Center>
              <Avatar.Group spacing={8}>{avatars}</Avatar.Group>
            </Center>
          </>
        )}
      </div>
    </div>
  );
}
