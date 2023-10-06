import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';
import { useStyles } from './DiffDetail';

interface IMonacoProps {
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
export const TextDiff = ({ newState, oldState, language }: IMonacoProps) => {
  const { classes, cx } = useStyles();
  const editorRef = useRef<HTMLDivElement>(null);
  const leftHeader = useRef<HTMLDivElement>(null);
  const [diffMode, setDiffMode] = useState('side-by-side');

  const handleOptionChange = event => {
    setDiffMode(event.target.value);
  };

  useEffect(() => {
    // Create the editor instance
    const oldModel = monaco.editor.createModel(oldState.text, language);
    const newModel = monaco.editor.createModel(newState.text, language);

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
