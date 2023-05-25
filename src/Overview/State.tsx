import HtmlDiff from '@armantang/html-diff';
import '@armantang/html-diff/dist/index.css';
import { isCode, isMarkdown } from '@jupyterlab/nbformat';
import { createStyles } from '@mantine/core';
import React from 'react';
import { CellProvenance, NotebookProvenance } from '../Provenance/JupyterListener';

const useStyles = createStyles((theme, _params, getRef) => ({
  stateWrapper: {
    // empty space filling wrapper with small padding (for border of state)
    height: '100%',
    padding: '0.5rem',

    // start of with full width
    flexBasis: '100%'
    //maxWidth: '20rem' // limit the width to 20rem so you can also see other states when you expand
  },
  currentState: {
    flexShrink: 0 //dont shrink, because then they will collapse as much as possible
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

    // give jp-cells a transparant border
    '& .jp-Cell': {
      border: '1px solid #bdbdbd',
      padding: '0',
      borderRadius: '0.5rem',

      '&.active': {
        borderLeft: '2px solid #1976d2 !important'
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
  }
}));

interface IStateProps {
  fullWidth: boolean;
  state: NotebookProvenance;
  previousState?: NotebookProvenance;
  stateNo: number;
}

export function State({ state, stateNo, previousState, fullWidth }: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const cellsIter = state.cells.map((cell, i) => {
    console.log(cell.type, isCode(cell.inputModel), 'celltype');
    const isActiveCell = state.activeCellIndex === i;

    if (isMarkdown(cell.inputModel)) {
      // for markdown, show output (rendered markdown) instead of input (markdown source)
      const markdownOutputs = cell.outputHTML.map(output => {
        let content = output as HTMLElement;
        if (!fullWidth) {
          //remove all children that are not headers
          content.querySelectorAll(':not(h1, h2, h3, h4, h5, h6)').forEach(child => child.remove());
        }
        return (
          <div
            className={cx('jp-Cell', { ['active']: isActiveCell === true })}
            dangerouslySetInnerHTML={{ __html: content.outerHTML }}
          />
        );
      });
      return <div>{markdownOutputs}</div>;
    } else {
      // for code, show input (source code) and output (rendered output) next to each other
      let input = getInput(cell, i, isActiveCell, fullWidth);
      let output = getOutput(cell, i, isActiveCell, fullWidth);

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
          className={cx('jp-Cell', {
            ['active']: isActiveCell === true
          })}
        >
          {input}
          {split}
          {output}
        </div>
      );
    }
  });

  const cells: JSX.Element[] = cellsIter;
  return (
    <div
      className={cx(classes.stateWrapper, 'stateWrapper', 'jp-Notebook', {
        [classes.currentState]: fullWidth === true
      })}
    >
      <div className={cx(classes.state, 'state')}>
        {cells}
        <p></p>
        <hr></hr>
        <div>v{stateNo}</div>
      </div>
    </div>
  );

  function getInput(cell: CellProvenance, i: number, isActiveCell: boolean, fullWidth: boolean) {
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
      //If the state is not full width, just show a single line as indicator
      input = (
        <div className="input">
          <div className="jp-InputArea jp-Cell-inputArea jp-Editor jp-InputArea-editor">
            <br />
          </div>
        </div>
      );
    }

    //If there is a previous state, compare the input with the previous input
    if (previousState?.cells[i]?.inputHTML) {
      const diff = new HtmlDiff(
        (previousState.cells[i].inputHTML as HTMLElement).outerHTML,
        (cell.inputHTML as HTMLElement).outerHTML
      );
      const unifiedDiff = diff.getUnifiedContent();

      if (diff.newWords.length + diff.oldWords.length !== 0) {
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
          // just indicate the code cell with a single line (== 1 <br>)
          input = (
            <div className={cx(classes.unchanged, 'input')}>
              <div className={cx('jp-Editor', 'jp-InputArea-editor')}>
                <br />
              </div>
            </div>
          );
        }
      }
    }

    return input;
  }

  function getOutput(cell: CellProvenance, i: number, isActiveCell: boolean, fullWidth: boolean) {
    let output = <></>;

    if (isCode(cell.inputModel) && cell.outputHTML.length > 0) {
      output = (
        <div className="outputs jp-OutputArea jp-Cell-outputArea">
          {cell.outputHTML.map((output, j) => {
            if (previousState?.cells[i]?.outputHTML[j]) {
              const diff = new HtmlDiff(
                (previousState.cells[i].outputHTML[j] as HTMLElement).outerHTML,
                (output as HTMLElement).outerHTML
              );
              const unifiedDiff = diff.getUnifiedContent();
              if (diff.newWords.length + diff.oldWords.length !== 0) {
                return (
                  <div className={cx(classes.output, 'output')} dangerouslySetInnerHTML={{ __html: unifiedDiff }} />
                );
              } else {
                // is active?
                if (isActiveCell) {
                  //Show the unchanged output in full height
                  return (
                    <div
                      className={cx(classes.unchanged, 'output')}
                      dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }}
                    />
                  );
                } else {
                  // just indicate the output with a single line (== 1 <br>)
                  return (
                    <div className={cx(classes.unchanged, 'output')}>
                      <br />
                    </div>
                  );
                }
              }
            }
            return <div dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }} />;
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
