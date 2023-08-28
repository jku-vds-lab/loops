import { ReactWidget } from '@jupyterlab/apputils';
import { ICell } from '@jupyterlab/nbformat';
import { createStyles } from '@mantine/core';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef } from 'react';

const useStyles = createStyles((theme, _params, getRef) => ({
  diffDetail: {}
}));

interface IDiffDetailComponentProps {
  old?: string;
  current?: string;
}

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const DiffDetailComponent = ({ old, current }: IDiffDetailComponentProps): JSX.Element => {
  const { classes, cx } = useStyles();

  return <div className={cx(classes.diffDetail, 'diff-detail')}></div>;
};

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class DiffDetail extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor(private old?: ICell, private current?: ICell) {
    super();
    this.addClass('jp-ReactWidget');
    this.id = 'DiffDetail';
    this.title.label = 'Cell Difference';
    this.title.closable = true;
  }

  render(): JSX.Element {
    // return <DiffDetailComponent old={this.old} current={this.current} />;
    return <MonacoEditor oldCode={this.old?.source ?? ''} newCode={this.current?.source || ''} language="python" />;
  }
}

const MonacoEditor = ({ newCode, oldCode, language }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create the editor instance
    const oldModel = monaco.editor.createModel(oldCode, language);
    const newModel = monaco.editor.createModel(newCode, language);

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

        // Render the diff inline
        renderSideBySide: true
      });
      diffEditor.setModel({
        original: oldModel,
        modified: newModel
      });
    }

    return () => {
      // Dispose the editor when the component unmounts
      oldModel.dispose();
      newModel.dispose();
      diffEditor?.dispose();
    };
  }, [newCode, oldCode, language]);

  return <div ref={editorRef} style={{ width: '100%', height: '400px' }} />;
};
