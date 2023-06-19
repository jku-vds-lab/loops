import HtmlDiff from '@armantang/html-diff';
import '@armantang/html-diff/dist/index.css';
import { isCode, isMarkdown } from '@jupyterlab/nbformat';
import { Center, createStyles } from '@mantine/core';
import React, { useState, useEffect } from 'react';
import { CellProvenance, NotebookProvenance } from '../Provenance/JupyterListener';
import { useLoopStore } from '../LoopStore';
import { ActionIcon } from '@mantine/core';
import { IconArrowsHorizontal, IconArrowsDiff } from '@tabler/icons-react';
import { mergeArrays } from '../util';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateWrapper: {
    // empty space filling wrapper with small padding (for border of state)
    height: '100%',
    padding: '0.5rem',

    // start of with full width
    flexBasis: '100%',
    minWidth: '3rem',
    maxWidth: '3rem'
  },
  wideState: {
    minWidth: '10rem', // keep larger than the compact states
    maxWidth: '20rem' // limit the width to 20rem so you can also see other states when you expand
  },
  state: {
    height: '100%',

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
        borderLeft: '2px solid #1976d2 !important'
      },

      '&.deleted': {
        border: '1px solid #F05268'
      },

      '&.added': {
        border: '1px solid #66C2A5'
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
    borderTop: '1px dashed #bdbdbd',
    margin: '1em',
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
        <div className={cx('jp-Cell', 'deleted', { ['active']: isActiveCell === true })}>
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
      console.log(cell.type, isCode(cell.inputModel), 'celltype');

      if (isMarkdown(cell.inputModel)) {
        // for markdown, show output (rendered markdown) instead of input (markdown source)
        const markdownOutputs = cell.outputHTML.map(output => {
          const content = output as HTMLElement;

          if (fullWidth) {
            return (
              <div
                className={cx(
                  'jp-Cell',
                  { ['active']: isActiveCell === true },
                  { ['added']: previousCell === undefined }
                )}
                dangerouslySetInnerHTML={{ __html: content.outerHTML }}
              />
            );
          } else {
            return (
              // content.querySelectorAll(':not(h1, h2, h3, h4, h5, h6)').forEach(child => child.remove());
              // return (
              //   <div
              //     className={cx('jp-Cell', { ['active']: isActiveCell === true })}
              //     dangerouslySetInnerHTML={{ __html: content.outerHTML }}
              //   />
              // );
              <div
                className={cx(
                  'jp-Cell',
                  { ['active']: isActiveCell === true },
                  { ['added']: previousCell === undefined }
                )}
              >
                <div style={{ height: '0.5em' }}></div>
              </div>
            );
          }
        });
        return <div>{markdownOutputs}</div>;
      } else {
        //from the previousState cell array, find the cell with the same id as the current cell
        const previousCell = previousState?.cells.find(c => c.id === cell.id);

        // for code, show input (source code) and output (rendered output) next to each other
        const input = getInput(cell, previousCell, isActiveCell, fullWidth);
        const output = getOutput(cell, previousCell, isActiveCell, fullWidth);

        // check if output has content
        const split =
          output.props.children && output.props.children?.length > 0 ? (
            <div className={cx(classes.inOutSplit)}></div>
          ) : (
            <></>
          );

        // create a cell with input and output
        return (
          <div
            className={cx(
              'jp-Cell',
              {
                ['active']: isActiveCell === true
              },
              { ['added']: previousCell === undefined }
            )}
          >
            {input}
            {split}
            {output}
          </div>
        );
      }
    }
    //else
    return <></>;
  });

  return (
    <div
      className={cx(classes.stateWrapper, 'stateWrapper', 'jp-Notebook', {
        [classes.wideState]: fullWidth // disable flexShrink if the state is full width
      })}
    >
      <div className={cx(classes.state, 'state')}>
        <header>
          <Center>
            <ActionIcon onClick={toggleFullwidth} title={fullWidth ? 'collapse' : 'expand'}>
              {fullWidth ? <IconArrowsDiff /> : <IconArrowsHorizontal />}
            </ActionIcon>
          </Center>
        </header>
        {cells}
        <div className={cx(classes.versionSplit)}>v{stateNo}</div>
      </div>
    </div>
  );

  function getInput(
    cell: CellProvenance,
    previousCell: CellProvenance | undefined,
    isActiveCell: boolean,
    fullWidth: boolean
  ) {
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

      if (diff.newWords.length + diff.oldWords.length !== 0 && fullWidth) {
        //If there are changes, show the diff
        input = <div className="input" dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
      } else {
        // No changes to this cell
        if (fullWidth && isActiveCell) {
          // if the cell is active, show the input as it is
          input = (
            <div
              className={cx(classes.unchanged, 'input')}
              dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }}
            />
          );
        } else {
          // if the cell is not active (and there are no changes), don't show the input at all
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
    }

    return input;
  }

  function getOutput(
    cell: CellProvenance,
    previousCell: CellProvenance | undefined,
    isActiveCell: boolean,
    fullWidth: boolean
  ) {
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
              if (diff.newWords.length + diff.oldWords.length !== 0 && fullWidth) {
                return (
                  <div className={cx(classes.output, 'output')} dangerouslySetInnerHTML={{ __html: unifiedDiff }} />
                );
              } else {
                // No changes to this cell
                if (fullWidth && isActiveCell) {
                  // if the cell is active, show the output as it is
                  return (
                    <div
                      className={cx(classes.unchanged, 'output')}
                      dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }}
                    />
                  );
                } else {
                  // if the cell is not active (and there are no changes), don't show the output at all
                  // just indicate the output
                  return (
                    <div className={cx(classes.unchanged, 'output')}>
                      <div style={{ height: '0.5em' }}></div>
                    </div>
                  );
                }
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
    return output;
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
