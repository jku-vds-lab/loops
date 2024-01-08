import parse from 'html-react-parser';
import HtmlDiff from '@armantang/html-diff';
import '@armantang/html-diff/dist/index.css';
import { isCode, isMarkdown } from '@jupyterlab/nbformat';
import { Avatar, Center, Tooltip, createStyles } from '@mantine/core';
import React, { useState, useEffect, useRef } from 'react';
import { CellProvenance, NotebookProvenance } from '../Provenance/JupyterListener';
import { useLoopsStore } from '../LoopsStore';
import { ActionIcon } from '@mantine/core';
import { IconArrowsHorizontal, IconArrowsDiff } from '@tabler/icons-react';
import { getScrollParent, makePlural, mergeArrays } from '../util';
import { ExecutionBadge } from './ExecutionBadge';
import '@github/relative-time-element';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CompareBadge } from './CompareBadge';
import { createSummaryVisualizationFromHTML, hasDataframe } from '../Detail/DataDiff';
import { createUnifedDiff, hasImage } from '../Detail/ImgDetailDiff';
import { TypeIcon } from './TypeIcon';
import { User } from '@jupyterlab/services';
import { max } from '@lumino/algorithm';
import { CellUsers } from './CellUsers';
import { useIsVisible } from '../useIsVisible';

const useStyles = createStyles((theme, _params) => ({
  header: {
    borderBottom: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)'
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
  output: {
    '& .html-diff-create-inline-wrapper::after': {
      background: 'unset'
    },

    '& .html-diff-delete-inline-wrapper': {
      display: 'none'
    }
  },
  inOutSplit: {
    // borderTop: '1px solid var(--jp-toolbar-border-color)'
  },
  versionSplit: {
    label: 'version-split',
    borderTop: '1px solid var(--jp-toolbar-border-color)',
    marginTop: '1em',
    textAlign: 'center'
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
  handleScroll: (stateNo: number) => void;
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
  handleScroll,
  multiUser
}: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  const [fullWidth, setFullWidth] = useState(stateDoI === 1); // on first render, initialize with stateDoI
  useEffect(() => {
    // update widthon subsequent renders if stateDoI changes
    setFullWidth(stateDoI === 1);
  }, [stateDoI]);
  const toggleFullwidth = () => {
    setFullWidth(!fullWidth);
  };

  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

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

  const isVisible = useIsVisible(stateScrollerRef); // effect below will run when visibility changes
  useEffect(
    () => {
      if (isVisible) {
        scrollToElement();
      }
    } //, [activeCellTop] // commented out: dpeend on activeCellTop --> run if the value changes
    //currently: no dependency --> run on every render
  );

  // useEffect(() => {
  //   const element = stateScrollerRef.current;
  //   const handleScrollWrapper = () => handleScroll(stateNo);

  //   if (element !== null) {
  //     element.addEventListener('scroll', handleScrollWrapper);
  //   }

  //   return () => {
  //     if (element !== null) {
  //       element.removeEventListener('scroll', handleScrollWrapper);
  //     }
  //   };
  // }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

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
      return createDeletedProvCell(cellId, isActiveCell);
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
        return createMarkdownProvCell(cell, previousCell, isActiveCell, cellId, executions);
      } else {
        return createCodeOrRawProvCell(cell, isActiveCell, cellId, executions);
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
      <div ref={stateScrollerRef} className={classes.stateScroller}>
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

  function createCodeOrRawProvCell(cell: CellProvenance, isActiveCell: boolean, cellId: string, executions: number) {
    //from the previousState cell array, find the cell with the same id as the current cell
    const previousCell = previousState?.cells.find(c => c.id === cell.id);

    // for code, show input (source code) and output (rendered output) next to each other
    const { input, inputChanged } = getInput(cell, previousCell, isActiveCell, fullWidth);
    const { output, outputChanged } = getOutput(cell, previousCell, isActiveCell, fullWidth);

    let type: 'code' | 'data' | 'img' = 'code';
    cell.outputHTML.forEach(output => {
      if (hasDataframe(output)) {
        type = 'data';
      } else if (hasImage(output)) {
        type = 'img';
      }
    });

    // check if output has content
    const split =
      output.props.children && output.props.children?.length > 0 ? (
        <div className={cx(classes.inOutSplit)}></div>
      ) : (
        <></>
      );

    const changedCell = previousCell !== undefined && (inputChanged || outputChanged);
    // create a cell with input and output
    return (
      <>
        <div
          data-cell-id={cellId}
          onClick={setActiveCell}
          onDoubleClick={toggleFullwidth}
          className={cx(
            'jp-Cell',
            { ['active']: isActiveCell === true },
            { ['added']: previousCell === undefined },
            { ['executed']: executions > 0 },
            { ['changed']: changedCell }
          )}
        >
          <TypeIcon type={type} executions={executions} />
          {multiUser && fullWidth ? <CellUsers cellUsers={cellExecutions.get(cellId)?.user ?? []} /> : <></>}
          <ExecutionBadge executions={executions} />
          {
            // Add CompareBadge if old, oldStateNo, and oldTimestamp are defined
            previousCell && previousStateNo && previousStateTimestamp && (
              <CompareBadge
                old={previousCell}
                oldStateNo={previousStateNo}
                oldTimestamp={previousStateTimestamp}
                current={cell}
                currentStateNo={stateNo}
                currentTimestamp={timestamp}
              />
            )
          }

          {input}
          {split}
          {output}
        </div>
      </>
    );
  }

  function createDeletedProvCell(cellId: string, isActiveCell): React.JSX.Element {
    return (
      <div data-cell-id={cellId} className={cx('jp-Cell', 'deleted', { ['active']: isActiveCell === true })}>
        <div style={{ height: '12.8px' }}></div>
      </div>
    );
  }

  function createMarkdownProvCell(
    cell: CellProvenance,
    previousCell: CellProvenance | undefined,
    isActiveCell: boolean,
    cellId: string,
    executions: number
  ) {
    // could be multiple outputs
    const markdownOutputs = cell.outputHTML.map((output, outputIndex) => {
      let content = output;
      let outputChanged = false;

      if (previousCell?.outputHTML[outputIndex] && content) {
        const diff = new HtmlDiff(previousCell.outputHTML[outputIndex], content);
        if (diff.newWords.length + diff.oldWords.length !== 0) {
          outputChanged = true;
          content = diff.getUnifiedContent();
        }
      }

      if (fullWidth) {
        return (
          <>
            <div
              data-cell-id={cellId}
              onClick={setActiveCell}
              onDoubleClick={toggleFullwidth}
              className={cx(
                'jp-Cell',
                { ['active']: isActiveCell === true },
                { ['added']: previousCell === undefined },
                { ['executed']: executions > 0 },
                { ['changed']: outputChanged }
              )}
            >
              <TypeIcon type={'markdown'} executions={executions} />
              {multiUser ? <CellUsers cellUsers={cellExecutions.get(cellId)?.user ?? []} /> : <></>}
              <ExecutionBadge executions={executions} />
              {
                // Add CompareBadge if old, oldStateNo, and oldTimestamp are defined
                previousCell && previousStateNo && previousStateTimestamp && (
                  <CompareBadge
                    old={previousCell}
                    oldStateNo={previousStateNo}
                    oldTimestamp={previousStateTimestamp}
                    current={cell}
                    currentStateNo={stateNo}
                    currentTimestamp={timestamp}
                  />
                )
              }
              {content !== undefined ? parse(content) : <></>}
            </div>
          </>
        );
      }
      //else: compact
      return (
        // content.querySelectorAll(':not(h1, h2, h3, h4, h5, h6)').forEach(child => child.remove());
        // return (
        //   <div
        //     className={cx('jp-Cell', { ['active']: isActiveCell === true })}
        //     dangerouslySetInnerHTML={{ __html: content.outerHTML }}
        //   />
        // );
        <>
          <div
            data-cell-id={cellId}
            onClick={setActiveCell}
            onDoubleClick={toggleFullwidth}
            className={cx(
              'jp-Cell',
              { ['active']: isActiveCell === true },
              { ['added']: previousCell === undefined },
              { ['executed']: executions > 0 },
              { ['changed']: outputChanged }
            )}
          >
            <TypeIcon type={'markdown'} executions={executions} />
            <ExecutionBadge executions={executions} />
            <div className={cx(classes.tinyHeight)}></div>
          </div>
        </>
      );
    });
    return <>{markdownOutputs}</>;
  }

  function getInput(
    cell: CellProvenance,
    previousCell: CellProvenance | undefined,
    isActiveCell: boolean,
    fullWidth: boolean
  ): { inputChanged: boolean; input: JSX.Element } {
    let inputChanged = false;
    //Default: show the input as it is
    let input = (
      <div className="input">
        <div
          className="input jp-InputArea jp-Cell-inputArea jp-Editor jp-InputArea-editor"
          dangerouslySetInnerHTML={{ __html: cell.inputHTML ?? '' }}
        />
      </div>
    );

    if (!fullWidth) {
      //If the state is not full width, just show a small area as indicator
      input = (
        <div className={cx(classes.tinyHeight, 'input')}>
          {/* <div className="jp-InputArea jp-Cell-inputArea jp-Editor jp-InputArea-editor">
            <div className={cx(classes.tinyHeight)}></div>
          </div> */}
        </div>
      );
    }

    //If there is a previous state, compare the input with the previous input
    if (previousCell?.inputHTML && cell.inputHTML) {
      const previousCode = (
        Array.isArray(previousCell.inputModel.source)
          ? previousCell.inputModel.source.join('\n')
          : previousCell.inputModel.source
      ).replace(/\n/g, '\n<br>');
      const currentCode = (
        Array.isArray(cell.inputModel.source) ? cell.inputModel.source.join('\n') : cell.inputModel.source
      ).replace(/\n/g, '\n<br>');
      const diff = new HtmlDiff(previousCode, currentCode);
      const unifiedDiff = diff.getUnifiedContent();

      const thisInputChanged = diff.newWords.length + diff.oldWords.length !== 0;
      inputChanged = inputChanged || thisInputChanged; // set to true if any input changed

      if (thisInputChanged && fullWidth) {
        // changed and full width --> show diff
        input = <div className="input mycode" dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
      } else if (fullWidth && isActiveCell) {
        // no change, but full width and active --> show input as it is
        input = (
          <div
            className={cx('unchanged', 'transparent', 'input')}
            onMouseEnter={e => {
              (e.target as HTMLDivElement)
                .closest('.jp-Cell')
                ?.querySelectorAll('.unchanged')
                .forEach(elem => elem.classList.remove('transparent'));
            }}
            onMouseLeave={e => {
              (e.target as HTMLDivElement)
                .closest('.jp-Cell')
                ?.querySelectorAll('.unchanged')
                .forEach(elem => elem.classList.add('transparent'));
            }}
            dangerouslySetInnerHTML={{ __html: cell.inputHTML ?? '' }}
          />
        );
      } else {
        // no change, not active, or not full width --> don't show input at all
        // just indicate the code cell
        input = <div className={cx('unchanged', 'transparent', 'input', classes.tinyHeight)}></div>;
      }
    }

    return {
      inputChanged,
      input
    };
  }

  function getOutput(
    cell: CellProvenance,
    previousCell: CellProvenance | undefined,
    isActiveCell: boolean,
    fullWidth: boolean
  ): { outputChanged: boolean; output: JSX.Element } {
    let outputChanged = false;
    let output = <></>;

    //  check if its a code cell and if there is output
    // raw cells have no output
    if (isCode(cell.inputModel) && cell.outputHTML.length > 0) {
      output = (
        <div className="outputs jp-OutputArea jp-Cell-outputArea">
          {cell.outputHTML.map((output, j) => {
            let stateOutput = output;
            if (hasDataframe(output)) {
              const cellColor: string =
                previousCell && hasDataframe(previousCell.outputHTML[j]) ? '#F5F5F5' : '#66C2A5';
              const tableSummary: HTMLDivElement = createSummaryVisualizationFromHTML(
                output,
                undefined,
                true,
                true,
                cellColor,
                cellColor,
                false
              );

              // add 5px padding:
              tableSummary.style.padding = '5px';
              stateOutput = tableSummary.outerHTML;
            }

            if (previousCell?.outputHTML[j] && output) {
              const diff = new HtmlDiff(previousCell.outputHTML[j], output);
              let unifiedDiff = diff.getUnifiedContent();

              const thisOutputChanged = diff.newWords.length + diff.oldWords.length !== 0;
              outputChanged = outputChanged || thisOutputChanged; // set to true if any output changed

              if (hasDataframe(output)) {
                //replace unified diff (for the case there is a change)
                if (hasDataframe(previousCell.outputHTML[j])) {
                  //both have dataframes
                  const tableSummary: HTMLDivElement = createSummaryVisualizationFromHTML(
                    output,
                    previousCell?.outputHTML[j],
                    true,
                    true,
                    '#F05268',
                    '#66C2A5',
                    false
                  );

                  // add 5px padding:
                  tableSummary.style.padding = '5px';
                  unifiedDiff = tableSummary.outerHTML;
                }
              } else if (hasImage(output) && hasImage(previousCell.outputHTML[j])) {
                // const imgSummary = createUnifedDiff(output, previousCell.outputHTML[j]);
                // unifiedDiff = imgSummary.outerHTML;
              }

              if (thisOutputChanged && fullWidth) {
                return (
                  <div className={cx(classes.output, 'output')} dangerouslySetInnerHTML={{ __html: unifiedDiff }} />
                );
              } else if (fullWidth && isActiveCell) {
                // no change, but full width and active --> show output as it is
                return (
                  <div
                    className={cx('unchanged', 'transparent', 'output')}
                    dangerouslySetInnerHTML={{ __html: stateOutput }}
                    onMouseEnter={e => {
                      (e.target as HTMLDivElement)
                        .closest('.jp-Cell')
                        ?.querySelectorAll('.unchanged')
                        .forEach(elem => elem.classList.remove('transparent'));
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLDivElement)
                        .closest('.jp-Cell')
                        ?.querySelectorAll('.unchanged')
                        .forEach(elem => elem.classList.add('transparent'));
                    }}
                  />
                );
              } else {
                // no change, not active, or not full width --> don't show output at all
                // just indicate the output
                return (
                  <div className={cx('unchanged', 'transparent', 'output')}>
                    <div className={cx()}></div>
                  </div>
                );
              }
            } else {
              // there is no previous state,

              if (fullWidth) {
                //just show the output (without diff)
                return <div dangerouslySetInnerHTML={{ __html: stateOutput }} />;
              } else {
                // if the state is not full width, don't show the output at all
                // just indicate the output
                return (
                  <div className={cx('unchanged', 'transparent', 'output')}>
                    <div className={cx()}></div>
                  </div>
                );
              }
            }
          })}
        </div>
      );
    }

    return {
      output,
      outputChanged
    };
  }
}

// function createCodeCell(cell: CellProvenance) {
//   const model = structuredClone(cell.inputModel);
//   const cellModel = new CodeCellModel({ cell: model, id: cell.id });
//   const codecell = new CodeCell({
//     model: cellModel,
//     rendermime: new RenderMimeRegistry(),
//     editorConfig: {
//       readOnly: true
//     }
//   });
//   const codeNode = codecell.node;
//   return <div dangerouslySetInnerHTML={{ __html: codeNode.outerHTML }}></div>;
// }

// function formatChildren(source: MultilineString): JSX.Element {
//   if (source === undefined || source === '') {
//     return <>&nbsp;</>;
//   } else if (Array.isArray(source)) {
//     return <>{source.join('\n')}</>;
//   }

//   return <>{source}</>;
// }

// function formatOutputs(outputs: any | undefined): JSX.Element {
//   if (Array.isArray(outputs)) {
//     return <>{outputs.map((output, i) => formatOutputs(output))}</>;
//   } else if (outputs.data && outputs.data?.['text/plain']) {
//     //direct output
//     if (Array.isArray(outputs.data?.['text/plain'])) {
//       return <>{outputs.data?.['text/plain'].join('\n')}</>;
//     } else {
//       return <>{outputs.data?.['text/plain']}</>;
//     }
//   } else if (outputs.text) {
//     console.log(outputs.text, 'text');
//     //print output
//     return <>{outputs.text}</>;
//   }
//   return <></>;
// }

// function processOutput(cell: CodeCell) {
//   const outputArea = cell.outputArea;
//   const children = outputArea.children();
//   console.log(toArray(children));
// }

interface IScrollableElement extends Element {
  onscrollend: ((this: IScrollableElement, ev: Event) => any) | null;
}
