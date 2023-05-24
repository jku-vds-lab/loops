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
    // slight margin and border around state
    // border: '1px solid #ccc',
    // borderRadius: '0.5rem',

    //make sure that the width and height of the parent container are note exceeded by the border
    // boxSizing: 'border-box',

    height: '100%',

    // the state itself uses a flex layout to arrange its elements
    // display: 'flex',
    // flexDirection: 'column'

    // set .jp-InputArea-editor  to block to avoid overflowing the state column horizontally
    "& .jp-InputArea-editor": {
      display: 'block'
    }
  },
  active: {
    'border-left': '4px solid #1976d2 !important'
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
  }
}));

interface IStateProps {
  fullWidth: boolean;
  state: NotebookProvenance;
  previousState?: NotebookProvenance;
  stateNo: number;
}

export function State({ state, stateNo, previousState, fullWidth: current }: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const cellsIter = state.cells.map((cell, i) => {
    console.log(cell.type, isCode(cell.inputModel), 'celltype');
    const isActiveCell = state.activeCellIndex === i;

    if (isMarkdown(cell.inputModel)) {
      // for markdown, show output (rendered markdown) instead of input (markdown source)
      return (
        <div>
          {cell.outputHTML.map(output => (
            <div className="input markdown" dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }} />
          ))}
        </div>
      );
    } else {
      // for code, show input (source code) and output (rendered output) next to each other
      let input = getInput(cell, i, isActiveCell);
      let output = getOutput(cell, i, isActiveCell);
      return (
        <div
          className={cx('jp-Cell', {
            [classes.active]: isActiveCell === true
          })}
        >
          {input}
          {output}
        </div>
      );

      // return (
      //   <CodeMirror
      //     value={cell.inputModel.source.toString()}
      //     height="auto"
      //     options={{
      //       ...CodeMirrorEditor.defaultConfig,
      //       mode: 'python'
      //     }}
      //   />
      // );
    }
  });

  const cells: JSX.Element[] = cellsIter;
  return (
    <div
      className={cx(classes.stateWrapper, 'stateWrapper', 'jp-Notebook', {
        [classes.currentState]: current === true
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

  function getInput(cell: CellProvenance, i: number, isActiveCell: boolean) {
    let input = (
      <div
        className="input jp-InputArea jp-Cell-inputArea"
        dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }} />
    );
    if (previousState?.cells[i]?.inputHTML) {
      const diff = new HtmlDiff(
        (previousState.cells[i].inputHTML as HTMLElement).outerHTML,
        (cell.inputHTML as HTMLElement).outerHTML
      );
      const unifiedDiff = diff.getUnifiedContent();
      if (diff.newWords.length + diff.oldWords.length !== 0) {
        input = <div className="input" dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
      } else {
        // is active?
        if (isActiveCell) {
          //Show the unchanged input in full height
          input = (
            <div
              className={cx(classes.unchanged, 'input')}
              dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }} />
          );
        } else {
          // just indicate the code cell with a single line (== 1 <br>)
          input = <div className={cx(classes.unchanged, 'input', 'jp-Editor', 'jp-InputArea-editor')}>
            <br />
          </div>;
        }
      }
    }
    return input;
  }

  function getOutput(cell: CellProvenance, i: number, isActiveCell: boolean) {
    let output = <></>;

    if (isCode(cell.inputModel)) {
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
                      dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }} />
                  );
                } else {
                  // just indicate the output with a single line (== 1 <br>)
                  return <div className={cx(classes.unchanged, 'output')}>
                    <br />
                  </div>;
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
