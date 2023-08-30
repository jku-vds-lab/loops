import { ReactWidget } from '@jupyterlab/apputils';
import { ICell } from '@jupyterlab/nbformat';
import { createStyles } from '@mantine/core';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';

const useStyles = createStyles((theme, _params, getRef) => ({
  diffDetail: {
    label: 'diffDetail',
    width: '100%',
    height: '100%',

    display: 'grid',
    //Frist column should be abozut 1/6 of the width, but at least 200px
    gridTemplateColumns: 'minmax(200px, 1fr) 5fr',
    gridTemplateRows: '1fr'
  },
  monacoOptions: {
    label: 'monacoOptions',
    display: 'flex',
    flexDirection: 'column',
    borderRight: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)',
    padding: '0.5rem',
    ' input': {
      marginRight: '0.5em'
    },
    ' header': {
      fontWeight: 600
    }
  },
  monacoWrapper: {
    label: 'monacoWrapper',
    width: '100%',
    height: '100%',

    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto 1fr'
  },
  monacoHeader: {
    label: 'monacoHeader',
    display: 'flex',
    textAlign: 'center',
    fontWeight: 600,
    // background: 'var(--jp-layout-color2)',
    borderBottom: 'calc(2 * var(--jp-border-width)) solid var(--jp-toolbar-border-color)'
  }
}));

interface IDiffDetailProps {
  cell: ICell;
  stateNo: number;
  timestamp: Date;
}

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class DiffDetail extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor(private old: IDiffDetailProps, private current: IDiffDetailProps) {
    super();
    this.addClass('jp-ReactWidget');
    this.id = 'DiffDetail';
    this.title.label = 'Cell Difference';
    this.title.closable = true;
  }

  render(): JSX.Element {
    // return <DiffDetailComponent old={this.old} current={this.current} />;
    return <MonacoEditor oldCode={this.old} newCode={this.current} language="python" />;
  }
}

interface IMonacoProps {
  newCode: IDiffDetailProps;
  oldCode: IDiffDetailProps;
  language: string;
}

const MonacoEditor = ({ newCode, oldCode, language }: IMonacoProps) => {
  const { classes, cx } = useStyles();
  const editorRef = useRef<HTMLDivElement>(null);
  const leftHeader = useRef<HTMLDivElement>(null);
  const [diffMode, setDiffMode] = useState('side-by-side');

  const handleOptionChange = event => {
    setDiffMode(event.target.value);
  };

  useEffect(() => {
    // Create the editor instance
    const oldModel = monaco.editor.createModel(oldCode.cell?.source.toString() ?? '', language);
    const newModel = monaco.editor.createModel(newCode.cell?.source.toString() ?? '', language);

    let diffEditor: monaco.editor.IStandaloneDiffEditor;
    if (editorRef.current) {
      console.log('ba bam bam BAM!');
      diffEditor = monaco.editor.createDiffEditor(editorRef.current, {
        // default editor props: https://microsoft.github.io/monaco-editor/typedoc/enums/editor.EditorOption.html
        // Diff editor props: https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IDiffEditorBaseOptions.html
        readOnly: true, // read only for new text
        originalEditable: false, // read only for old text
        automaticLayout: true, // taken from example, probably useful when resizing
        enableSplitViewResizing: true,
        ignoreTrimWhitespace: true, // ignore white ppace
        diffAlgorithm: 'advanced',
        renderIndicators: true, // +/- signs in the gutter
        renderLineHighlightOnlyWhenFocus: true,

        // Render the diff inline
        renderSideBySide: diffMode === 'side-by-side'
      });
      diffEditor.setModel({
        original: oldModel,
        modified: newModel
      });

      diffEditor.getOriginalEditor().onDidLayoutChange(layout => {
        if (leftHeader.current) {
          if (diffMode === 'side-by-side') {
            leftHeader.current.style.width = layout.width + 'px';
          } else {
            leftHeader.current.style.width = 'calc(50% - 14px)';
          }
        }
      });
    }

    return () => {
      // Dispose the editor when the component unmounts
      oldModel.dispose();
      newModel.dispose();
      diffEditor?.dispose();
    };
  }, [newCode, oldCode, language, diffMode]);

  return (
    <div className={cx(classes.diffDetail)}>
      <div className={cx(classes.monacoOptions)}>
        <header>Diff View</header>
        <label>
          <input
            type="radio"
            value="side-by-side"
            checked={diffMode === 'side-by-side'}
            onChange={handleOptionChange}
          />
          Side-by-Side
        </label>
        <label>
          <input type="radio" value="unified" checked={diffMode === 'unified'} onChange={handleOptionChange} />
          Unified
        </label>
      </div>
      <div className={cx(classes.monacoWrapper)}>
        <div className={cx(classes.monacoHeader)}>
          <div ref={leftHeader} style={{ width: 'calc(50% - 14px)' }}>
            v{oldCode.stateNo + 1},{' '}
            <relative-time datetime={oldCode.timestamp.toISOString()} precision="second">
              {oldCode.timestamp.toLocaleTimeString()} {oldCode.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
          <div style={{ flexGrow: '1' }}>
            v{newCode.stateNo + 1},{' '}
            <relative-time datetime={newCode.timestamp.toISOString()} precision="second">
              {newCode.timestamp.toLocaleTimeString()} {newCode.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
        </div>
        <div ref={editorRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
