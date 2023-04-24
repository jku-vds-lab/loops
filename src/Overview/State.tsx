import { CodeCell, CodeCellModel } from '@jupyterlab/cells';
import { MultilineString, isCode, isMarkdown, isRaw } from '@jupyterlab/nbformat';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { toArray } from '@lumino/algorithm';
import { createStyles } from '@mantine/core';
import 'codemirror/mode/python/python';
import React from 'react';
import { CellProvenance, NotebookProvenance } from '../Provenance/JupyterListener';
import CodeMirror from '@uiw/react-codemirror';
import { CodeMirrorEditor, CodeMirrorMimeTypeService, editorServices } from '@jupyterlab/codemirror';
import { CodeCellDiff } from './Diffs/CodeCellDiff';

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
  }
}));

interface IStateProps {
  current: boolean;
  state: NotebookProvenance;
  stateNo: number;
}

export function State({ state, stateNo, current }: IStateProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (!state) {
    return <div>State {stateNo} not found</div>;
  }

  const cellsIter = state.cells.map((cell, i) => {
    console.log(cell.type, isCode(cell.input), 'celltype');

    // eslint-disable-next-line no-constant-condition
    if (isCode(cell.input)) {
      return (
        <CodeMirror
          value={cell.input.source.toString()}
          height="auto"
          options={{
            ...CodeMirrorEditor.defaultConfig,
            mode: 'python'
          }}
        />
      );

      //return createCodeCell(cell);
      // processOutput(cell);

      //return <></>;
    } else if (isMarkdown(cell.input)) {
      console.log('cell is markdown');
    } else if (isRaw(cell.input)) {
      console.log('cell is raw');
    }

    return (
      <CodeCellDiff key={cell.id} active={cell.active}>
        {/* {current ? formatChildren(cell.value?.text) : <>&nbsp;</>} */}
        {formatChildren(cell.input.source)}
      </CodeCellDiff>
    );
  });
  const cells: JSX.Element[] = toArray(cellsIter);
  return (
    <div
      className={cx(classes.stateWrapper, 'stateWrapper', {
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
  const model = structuredClone(cell.input);
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
