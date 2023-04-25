import { CodeCell, CodeCellModel } from '@jupyterlab/cells';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { MultilineString, isCode, isMarkdown, isRaw } from '@jupyterlab/nbformat';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { toArray } from '@lumino/algorithm';
import { createStyles } from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/mode/python/python';
import React from 'react';
import { CellProvenance, NotebookProvenance } from '../Provenance/JupyterListener';
import { CodeCellDiff } from './Diffs/CodeCellDiff';
import '@armantang/html-diff/dist/index.css';
import HtmlDiff from '@armantang/html-diff';

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
  },
  unchanged: {
    color: 'transparent !important',
    ['*']: {
      color: 'transparent !important'
    }
  }
}));

interface IStateProps {
  current: boolean;
  state: NotebookProvenance;
  previousState?: NotebookProvenance;
  stateNo: number;
}

export function State({ state, stateNo, previousState, current }: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const cellsIter = state.cells.map((cell, i) => {
    console.log(cell.type, isCode(cell.inputModel), 'celltype');
    // eslint-disable-next-line no-constant-condition
    if (isMarkdown(cell.inputModel)) {
      return (
        <div>
          {cell.outputHTML.map(output => (
            <div dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }} />
          ))}
        </div>
      );
    } else {
      let input = (
        <div
          className="jp-InputArea jp-Cell-inputArea"
          dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }}
        />
      );
      if (previousState && previousState.cells[i].inputHTML) {
        const diff = new HtmlDiff(
          (previousState.cells[i].inputHTML as HTMLElement).outerHTML,
          (cell.inputHTML as HTMLElement).outerHTML
        );
        const unifiedDiff = diff.getUnifiedContent();
        if (diff.newWords.length + diff.oldWords.length !== 0) {
          input = <div dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
        } else {
          input = (
            <div
              className={classes.unchanged}
              dangerouslySetInnerHTML={{ __html: (cell.inputHTML as HTMLElement).outerHTML }}
            />
          );
        }
      }
      let output = <></>;

      if (isCode(cell.inputModel)) {
        output = (
          <div>
            {cell.outputHTML.map((output, j) => {
              if (previousState && previousState.cells[i].outputHTML[j]) {
                const diff = new HtmlDiff(
                  (previousState.cells[i].outputHTML[j] as HTMLElement).outerHTML,
                  (output as HTMLElement).outerHTML
                );
                const unifiedDiff = diff.getUnifiedContent();
                if (diff.newWords.length + diff.oldWords.length !== 0) {
                  return <div dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
                } else {
                  return (
                    <div
                      className={classes.unchanged}
                      dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }}
                    />
                  );
                }
              }
              return <div dangerouslySetInnerHTML={{ __html: (output as HTMLElement).outerHTML }} />;
            })}
          </div>
        );
      }
      return (
        <div>
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

  const cells: JSX.Element[] = toArray(cellsIter);
  return (
    <div
      className={cx(classes.stateWrapper, 'stateWrapper', 'jp-Notebook', {
        [classes.currentState]: current === true
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

function createCodeCell(cell: CellProvenance) {
  const model = structuredClone(cell.inputModel);
  const cellModel = new CodeCellModel({ cell: model, id: cell.id });
  const codecell = new CodeCell({
    model: cellModel,
    rendermime: new RenderMimeRegistry(),
    editorConfig: {
      readOnly: true
    }
  });
  const codeNode = codecell.node;
  return <div dangerouslySetInnerHTML={{ __html: codeNode.outerHTML }}></div>;
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

function processOutput(cell: CodeCell) {
  const outputArea = cell.outputArea;
  const children = outputArea.children();
  console.log(toArray(children));
}
