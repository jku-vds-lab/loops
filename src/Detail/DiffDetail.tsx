import { ReactWidget } from '@jupyterlab/apputils';
import { IError } from '@jupyterlab/nbformat';
import { copyIcon } from '@jupyterlab/ui-components';
import { Tabs, createStyles } from '@mantine/core';
import { IconFileCode, IconFileText, IconPhoto } from '@tabler/icons-react';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';
import { CellProvenance, CodeCellProvenance, isCodeCellProvenance } from '../Provenance/JupyterListener';

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
  cell: CellProvenance;
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
    this.title.icon = copyIcon;
    //set height of the Widget
    this.node.style.minHeight = window.innerHeight / 5 + 'px';
    this.node.style.height = window.innerHeight / 3 + 'px';
  }

  render(): JSX.Element {
    const diffTools: { tab: JSX.Element; panel: JSX.Element }[] = [];

    // input diff for code and raw cells
    if (['code', 'raw'].includes(this.current.cell.type)) {
      //adapt syntax highlight to cell type
      const language = this.current.cell.type === 'code' ? 'python' : 'text/plain';
      diffTools.push({
        tab: (
          <Tabs.Tab icon={<IconFileCode />} value="input">
            Code
          </Tabs.Tab>
        ),
        panel: (
          <Tabs.Panel value="input">
            <MonacoEditor
              oldState={{
                text: this.old.cell.inputModel.source.toString(),
                timestamp: this.old.timestamp,
                stateNo: this.old.stateNo
              }}
              newState={{
                text: this.current.cell.inputModel.source.toString(),
                timestamp: this.current.timestamp,
                stateNo: this.current.stateNo
              }}
              language={language}
            />
          </Tabs.Panel>
        )
      });
    }

    // output diff for code cells
    if (isCodeCellProvenance(this.current.cell)) {
      for (const [outputIndex, output] of this.current.cell.output.entries()) {
        const type = output.output_type;
        // type can be:
        // * stream:  prints or streaming outputs (there can be multiple stream outputs, e.g., for stdout and stderr)
        // * execute_result: last line of cell
        // * display_data:  seaborn/matplotlib
        // * update_display_data: update a display_data output
        // * error: errors during code execution

        if (type === 'stream') {
          const key = type;

          // add text diff
          diffTools.push({
            tab: (
              <Tabs.Tab icon={<IconFileText />} value={`output-${outputIndex}-${key}`}>
                Output {outputIndex}: {key}
              </Tabs.Tab>
            ),
            panel: (
              <Tabs.Panel value={`output-${outputIndex}-${key}`}>
                <MonacoEditor
                  newState={{
                    text: output.text?.toString() ?? '',
                    timestamp: this.old.timestamp,
                    stateNo: this.old.stateNo
                  }}
                  oldState={{
                    text: (this.old.cell as CodeCellProvenance).output[outputIndex]?.text?.toString() ?? '',
                    timestamp: this.current.timestamp,
                    stateNo: this.current.stateNo
                  }}
                  language={key}
                />
              </Tabs.Panel>
            )
          });
        } else if (type === 'error') {
          const key = type;
          // Remove Ansi Escape Sequences as they are not rendered correctly
          // Regex src: https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
          // disable eslint warning on next line, because we want to match the ansi escape sequences it is complaining about
          // eslint-disable-next-line no-control-regex
          const ansiRegex = new RegExp('\u001b[^m]*?m', 'g');
          const text = (output as IError).traceback.join('\n').replace(ansiRegex, '');
          const oldText = (((this.old.cell as CodeCellProvenance).output[outputIndex] as IError)?.traceback ?? [])
            .join('\n')
            .replace(ansiRegex, '');
          // add text diff
          diffTools.push({
            tab: (
              <Tabs.Tab icon={<IconFileText />} value={`output-${outputIndex}-${key}`}>
                Output {outputIndex}: {key}
              </Tabs.Tab>
            ),
            panel: (
              <Tabs.Panel value={`output-${outputIndex}-${key}`}>
                <MonacoEditor
                  newState={{
                    text,
                    timestamp: this.old.timestamp,
                    stateNo: this.old.stateNo
                  }}
                  oldState={{
                    text: oldText,
                    timestamp: this.current.timestamp,
                    stateNo: this.current.stateNo
                  }}
                  language={key}
                />
              </Tabs.Panel>
            )
          });
        } else if (['execute_result', 'display_data', 'update_display_data'].includes(type)) {
          // iterate over data
          const data = output.data;
          for (const [key, value] of Object.entries(data ?? {})) {
            if (key.includes('image')) {
              // add image diff
              diffTools.push({
                tab: (
                  <Tabs.Tab icon={<IconPhoto />} value={`output-${outputIndex}-${key}`}>
                    Output {outputIndex}: {key}
                  </Tabs.Tab>
                ),
                panel: <Tabs.Panel value={`output-${outputIndex}-${key}`}>IMG DIFF</Tabs.Panel>
              });
            } else {
              // add text diff
              diffTools.push({
                tab: (
                  <Tabs.Tab icon={<IconFileText />} value={`output-${outputIndex}-${key}`}>
                    Output {outputIndex}: {key}
                  </Tabs.Tab>
                ),
                panel: (
                  <Tabs.Panel value={`output-${outputIndex}-${key}`}>
                    <MonacoEditor
                      newState={{ text: value, timestamp: this.old.timestamp, stateNo: this.old.stateNo }}
                      oldState={{
                        text: (this.old.cell as CodeCellProvenance).output[outputIndex]?.data?.[key]?.toString() ?? '',
                        timestamp: this.current.timestamp,
                        stateNo: this.current.stateNo
                      }}
                      language={key}
                    />
                  </Tabs.Panel>
                )
              });
            }
          }
        }

        // data can be:
        // * text/plain: print() output
        // * text/html: e.g., pandas dataframes
        // * image/png: e.g., seaborn/matplotlib
        // * image/jpeg
        // * image/svg+xml
        // * application/vnd.jupyter.stderr: print to stderr  (e.g. warnings)
        // * application/vnd.jupyter.stdout: print to stdout

        // First images, then html, finally plain text
        // ignore everything else for now
        console.log('output', type, output);
      }
    }

    // TODO markdown diff

    // return <>{...diffTools}</>;
    return (
      // Default Value == Tab that is opened on startup
      <Tabs defaultValue="input" orientation="vertical" style={{ height: '100%' }}>
        <Tabs.List style={{ flexWrap: 'nowrap' }}>
          {/* Order does matter */}
          {...diffTools.map(tool => tool.tab)}
        </Tabs.List>

        {/* Order does not matter */}
        {...diffTools.map(tool => tool.panel)}
      </Tabs>
    );
  }
}

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

const MonacoEditor = ({ newState, oldState, language }: IMonacoProps) => {
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

interface IOutputDiffProps {
  newCell: IDiffDetailProps;
  oldCell: IDiffDetailProps;
}

const OutputDiff = ({ newCell, oldCell }: IOutputDiffProps) => {
  const { classes, cx } = useStyles();
  return (
    <div className={cx(classes.diffDetail)}>
      <div className={cx(classes.monacoOptions)}>
        <header>Diff View</header>
        TODO
      </div>
      <div className={cx(classes.monacoWrapper)}>
        <div className={cx(classes.monacoHeader)}>DIFF header</div>
        <div>diff diff</div>
      </div>
    </div>
  );
};
