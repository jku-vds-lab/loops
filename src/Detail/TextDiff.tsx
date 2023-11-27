import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';
import { Tabs, createStyles } from '@mantine/core';

export const useStyles = createStyles((theme, _params, getRef) => ({
  diffDetail: {
    label: 'diffDetail',
    width: '100%',
    height: '100%',

    display: 'grid',
    //Frist column should be abozut 1/6 of the width, but at least 200px
    gridTemplateColumns: 'minmax(200px, 1fr) 5fr',
    gridTemplateRows: '1fr',

    accentColor: '#66C2A5'
  },
  textDiffOptions: {
    label: 'textDiffOptions',
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
  textDiffWrapper: {
    label: 'textDiffWrapper',
    width: '100%',
    height: '100%',

    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto 1fr'
  },
  textDiffHeader: {
    label: 'textDiffHeader',
    display: 'flex',
    textAlign: 'center',
    fontWeight: 600,
    // background: 'var(--jp-layout-color2)',
    borderBottom: 'calc(2 * var(--jp-border-width)) solid var(--jp-toolbar-border-color)'
  }
}));

interface ITextDiffProps {
  newState: {
    text: string;
    timestamp: Date;
    stateNo: number;
  };
  oldState: {
    text: string;
    timestamp: Date;
    stateNo: number;
  };
  language: string;
}
export const TextDiff = ({ newState, oldState, language }: ITextDiffProps) => {
  const { classes, cx } = useStyles();
  const editorRef = useRef<HTMLDivElement>(null);
  const leftHeader = useRef<HTMLDivElement>(null);
  const [diffMode, setDiffMode] = useState('side-by-side');

  const diffContent = language.includes('text') ? 'Text' : 'Code';

  const handleOptionChange = event => {
    setDiffMode(event.target.value);
  };

  useEffect(() => {
    // Create the editor instance
    const oldModel = monaco.editor.createModel(oldState.text, language);
    const newModel = monaco.editor.createModel(newState.text, language);

    monaco.editor.defineTheme('diffTheme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'diffEditor.insertedLineBackground': '#66C2A555',
        'diffEditor.insertedTextBackground': '#66C2A599',
        'diffEditorGutter.insertedLineBackground': '#66C2A5',
        'diffEditor.removedLineBackground': '#F0526855',
        'diffEditor.removedTextBackground': '#F0526899',
        'diffEditorGutter.removedLineBackground': '#F05268'
      }
    });

    let diffEditor: monaco.editor.IStandaloneDiffEditor;
    if (editorRef.current) {
      diffEditor = monaco.editor.createDiffEditor(editorRef.current, {
        // default editor props: https://microsoft.github.io/monaco-editor/typedoc/enums/editor.EditorOption.html
        // Diff editor props: https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IDiffEditorBaseOptions.html
        readOnly: true,
        originalEditable: false,
        automaticLayout: true,
        enableSplitViewResizing: true,
        ignoreTrimWhitespace: true,
        diffAlgorithm: 'advanced',
        renderIndicators: true,
        renderLineHighlightOnlyWhenFocus: true,
        theme: 'diffTheme',

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
  }, [newState, oldState, language, diffMode]);

  return (
    <div className={cx(classes.diffDetail)}>
      <div className={cx(classes.textDiffOptions)}>
        <header>{diffContent} Diff View</header>
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
      <div className={cx(classes.textDiffWrapper)}>
        <div className={cx(classes.textDiffHeader)}>
          <div ref={leftHeader} style={{ width: 'calc(50% - 14px)' }}>
            v{oldState.stateNo + 1},{' '}
            <relative-time datetime={oldState.timestamp.toISOString()} precision="second">
              {oldState.timestamp.toLocaleTimeString()} {oldState.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
          <div style={{ flexGrow: '1' }}>
            v{newState.stateNo + 1},{' '}
            <relative-time datetime={newState.timestamp.toISOString()} precision="second">
              {newState.timestamp.toLocaleTimeString()} {newState.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
        </div>
        <div ref={editorRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
