import HtmlDiff from '@armantang/html-diff';
import '@armantang/html-diff/dist/index.css';
import { isCode, isMarkdown } from '@jupyterlab/nbformat';
import { Center, createStyles } from '@mantine/core';
import React, { useState, useEffect, useRef } from 'react';
import { CellProvenance, NotebookProvenance } from '../Provenance/JupyterListener';
import { useLoopStore } from '../LoopStore';
import { ActionIcon } from '@mantine/core';
import { IconArrowsHorizontal, IconArrowsDiff } from '@tabler/icons-react';
import { mergeArrays } from '../util';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateWrapper: {
    padding: '0.5rem',

    // sizing within the state list (Default = compact)
    minWidth: '3rem',
    maxWidth: '3rem',
    label: '1rapper',

    overflowY: 'auto'
  },
  wideState: {
    label: 'wide-state',
    minWidth: '10rem', // keep larger than the compact states
    maxWidth: '20rem' // limit the width to 20rem so you can also see other states when you expand
  },
  state: {
    label: 'state',

    // the state itself uses a flex layout to arrange its elements
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem 0',

    '& .jp-InputArea-editor': {
      // set .jp-InputArea-editor  to block to avoid overflowing the state column horizontally
      display: 'block',
      //background: 'unset',
      border: 'unset'
    },

    '& .jp-Cell': {
      border: '1px solid #bdbdbd',
      padding: '0',
      borderRadius: '0.5rem',

      '& .jp-MarkdownOutput': {
        display: 'block',
        overflow: 'auto',
        whiteSpace: 'nowrap'
      },

      '&.active': {
        borderLeft: '2px solid var(--jp-brand-color1) !important'
      },

      '&.active::before': {
        background: 'unset'
      },

      '&.deleted': {
        border: '1px solid #F05268'
      },

      '&.added': {
        border: '1px solid #66C2A5'
      },

      '&.changed': {
        border: '1px solid #FBE156'
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
  unchanged: {
    color: 'transparent !important',
    ['*']: {
      color: 'transparent !important'
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
    borderTop: '1px solid #bdbdbd'
  },
  versionSplit: {
    label: 'version-split',
    borderTop: '1px dashed #bdbdbd',
    margin: '1em 0',
    textAlign: 'center',
    padding: '0.5em 0'
  }
}));

interface IStateProps {
  stateDoI: number;
  state: NotebookProvenance;
  previousState?: NotebookProvenance;
  stateNo: number;
}

export function State({ state, stateNo, previousState, stateDoI }: IStateProps): JSX.Element {
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

  const activeCellId = useLoopStore(state => state.activeCellID);
  const activeCellTop = useLoopStore(state => state.activeCellTop);
  const stateWrapperRef = useRef<HTMLDivElement>(null);
  const stateHeaderRef = useRef<HTMLDivElement>(null);

  const scrollToElement = () => {
    const provCellTop = stateWrapperRef.current?.querySelector<HTMLDivElement>(
      `[data-cell-id="${activeCellId}"]`
    )?.offsetTop;
    const headerHeight = stateHeaderRef.current?.offsetHeight || 0;

    if (activeCellTop && provCellTop) {
      const scrollPos = provCellTop - activeCellTop + headerHeight;
      stateWrapperRef.current?.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToElement();
  }, [activeCellTop]);

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

      return (
        <div
          data-cell-id={cellId}
          className={cx(
            'jp-Cell',
            'deleted'
            // { ['active']: isActiveCell === true }
          )}
        >
          <div style={{ height: '0.25rem' }}></div>
        </div>
      );
    } else if (cell === undefined && previousCell === undefined) {
      // cell is in none of the states
      // weird, but nothing to do
      return <></>;
    } else if (cell !== undefined) {
      // cell was added (previousCell is undefined) or changed (previousCell defined) in current state
      // cell is in both states, possibly changed

      // console.log(cell.type, isCode(cell.inputModel), 'celltype');

      if (isMarkdown(cell.inputModel)) {
        // for markdown, show output (rendered markdown) instead of input (markdown source)

        // could be multiple outputs
        const markdownOutputs = cell.outputHTML.map((output, outputIndex) => {
          let content = (output as HTMLElement).outerHTML;
          let outputChanged = false;

          if (previousCell?.outputHTML[outputIndex]) {
            const diff = new HtmlDiff((previousCell.outputHTML[outputIndex] as HTMLElement).outerHTML, content);
            if (diff.newWords.length + diff.oldWords.length !== 0) {
              outputChanged = true;
              content = diff.getUnifiedContent();
            }
          }

          if (fullWidth) {
            return (
              <>
                {isActiveCell ? <div className={cx(classes.activeSeperator, classes.activeSeperatorTop)}></div> : <></>}
                <div
                  data-cell-id={cellId}
                  className={cx(
                    'jp-Cell',
                    // { ['active']: isActiveCell === true },
                    { ['added']: previousCell === undefined },
                    { ['changed']: outputChanged }
                  )}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                {isActiveCell ? (
                  <div className={cx(classes.activeSeperator, classes.activeSeperatorBottom)}></div>
                ) : (
                  <></>
                )}
              </>
            );
          } else {
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
                {isActiveCell ? <div className={cx(classes.activeSeperator, classes.activeSeperatorTop)}></div> : <></>}
                <div
                  data-cell-id={cellId}
                  className={cx(
                    'jp-Cell',
                    // { ['active']: isActiveCell === true },
                    { ['added']: previousCell === undefined },
                    { ['changed']: outputChanged }
                  )}
                >
                  <div style={{ height: '0.5em' }}></div>
                </div>
                {isActiveCell ? (
                  <div className={cx(classes.activeSeperator, classes.activeSeperatorBottom)}></div>
                ) : (
                  <></>
                )}
              </>
            );
          }
        });
        return <>{markdownOutputs}</>;
      } else {
        //from the previousState cell array, find the cell with the same id as the current cell
        const previousCell = previousState?.cells.find(c => c.id === cell.id);

        // for code, show input (source code) and output (rendered output) next to each other
        const { input, inputChanged } = getInput(cell, previousCell, isActiveCell, fullWidth);
        const { output, outputChanged } = getOutput(cell, previousCell, isActiveCell, fullWidth);

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
            {isActiveCell ? <div className={cx(classes.activeSeperator, classes.activeSeperatorTop)}></div> : <></>}
            <div
              data-cell-id={cellId}
              className={cx(
                'jp-Cell',
                // { ['active']: isActiveCell === true },
                { ['added']: previousCell === undefined },
                { ['changed']: changedCell }
              )}
            >
              {input}
              {split}
              {output}
            </div>
            {isActiveCell ? <div className={cx(classes.activeSeperator, classes.activeSeperatorBottom)}></div> : <></>}
          </>
        );
      }
    }
    //else
    return <></>;
  });

  return (
    <div
      ref={stateWrapperRef}
      className={cx(classes.stateWrapper, {
        // removed  'jp-Notebook' class
        [classes.wideState]: fullWidth // disable flexShrink if the state is full width
      })}
    >
      <div className={cx(classes.state, 'state')}>
        <header ref={stateHeaderRef}>
          <Center>
            <ActionIcon onClick={toggleFullwidth} title={fullWidth ? 'collapse' : 'expand'}>
              {fullWidth ? <IconArrowsDiff /> : <IconArrowsHorizontal />}
            </ActionIcon>
          </Center>
        </header>
        <div style={{ height: '100vh' }}></div>
        {cells}
        <div className={cx(classes.versionSplit)}>v{stateNo}</div>
        <div style={{ height: '100vh' }}></div>
      </div>
    </div>
  );

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
          dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }}
        />
      </div>
    );

    if (!fullWidth) {
      //If the state is not full width, just show a small area as indicator
      input = (
        <div className="input">
          <div className="jp-InputArea jp-Cell-inputArea jp-Editor jp-InputArea-editor">
            <div style={{ height: '0.5em' }}></div>
          </div>
        </div>
      );
    }

    //If there is a previous state, compare the input with the previous input
    if (previousCell?.inputHTML) {
      const diff = new HtmlDiff(
        (previousCell.inputHTML as HTMLElement).outerHTML,
        (cell.inputHTML as HTMLElement).outerHTML
      );
      const unifiedDiff = diff.getUnifiedContent();

      const thisInputChanged = diff.newWords.length + diff.oldWords.length !== 0;
      inputChanged = inputChanged || thisInputChanged; // set to true if any input changed

      if (thisInputChanged && fullWidth) {
        // changed and full width --> show diff
        input = <div className="input" dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
      } else if (fullWidth && isActiveCell) {
        // no change, but full width and active --> show input as it is
        input = (
          <div
            className={cx(classes.unchanged, 'input')}
            dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }}
          />
        );
      } else {
        // no change, not active, or not full width --> don't show input at all
        // just indicate the code cell
        input = (
          <div className={cx(classes.unchanged, 'input')}>
            <div className={cx('jp-Editor', 'jp-InputArea-editor')}>
              <div style={{ height: '0.5em' }}></div>
            </div>
          </div>
        );
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

    if (isCode(cell.inputModel) && cell.outputHTML.length > 0) {
      output = (
        <div className="outputs jp-OutputArea jp-Cell-outputArea">
          {cell.outputHTML.map((output, j) => {
            if (previousCell?.outputHTML[j]) {
              const diff = new HtmlDiff(
                (previousCell.outputHTML[j] as HTMLElement).outerHTML,
                (output as HTMLElement).outerHTML
              );
              const unifiedDiff = diff.getUnifiedContent();

              const thisOutputChanged = diff.newWords.length + diff.oldWords.length !== 0;
              outputChanged = outputChanged || thisOutputChanged; // set to true if any output changed

              if (thisOutputChanged && fullWidth) {
                return (
                  <div className={cx(classes.output, 'output')} dangerouslySetInnerHTML={{ __html: unifiedDiff }} />
                );
              } else if (fullWidth && isActiveCell) {
                // no change, but full width and active --> show output as it is
                return (
                  <div
                    className={cx(classes.unchanged, 'output')}
                    dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }}
                  />
                );
              } else {
                // no change, not active, or not full width --> don't show output at all
                // just indicate the output
                return (
                  <div className={cx(classes.unchanged, 'output')}>
                    <div style={{ height: '0.5em' }}></div>
                  </div>
                );
              }
            } else {
              // there is no previous state,

              if (fullWidth) {
                //just show the output (without diff)
                return <div dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }} />;
              } else {
                // if the state is not full width, don't show the output at all
                // just indicate the output
                return (
                  <div className={cx(classes.unchanged, 'output')}>
                    <div style={{ height: '0.5em' }}></div>
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
