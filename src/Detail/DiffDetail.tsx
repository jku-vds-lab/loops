import { ReactWidget } from '@jupyterlab/apputils';
import { IError } from '@jupyterlab/nbformat';
import { copyIcon } from '@jupyterlab/ui-components';
import { Tabs, createStyles } from '@mantine/core';
import { IconFileCode, IconFileText, IconPhoto } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import { CellProvenance, CodeCellProvenance, isCodeCellProvenance } from '../Provenance/JupyterListener';
import { TextDiff } from './TextDiff';

export const useStyles = createStyles((theme, _params, getRef) => ({
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
            <TextDiff
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
                <TextDiff
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
                <TextDiff
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
                panel: (
                  <Tabs.Panel value={`output-${outputIndex}-${key}`}>
                    <ImgDiff newCell={this.current} oldCell={this.old} />
                  </Tabs.Panel>
                )
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
                    <TextDiff
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

const ImgDiff = ({ newCell, oldCell }: IOutputDiffProps) => {
  const { classes, cx } = useStyles();
  const leftHeader = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState('side-by-side');
  const handleDiffModeChange = event => {
    setDiffMode(event.target.value);
  };

  const [showChanges, setHighlightChanges] = React.useState(false);
  const handleHighlightChangesChange = () => {
    setHighlightChanges(!showChanges);
  };

  const [greyScale, setGreyScale] = React.useState(false);
  const handleGreyScaleChange = () => {
    setGreyScale(!greyScale);
  };

  const [oldBase64, setOldBase64] = useState(prepareBase64(oldCell));
  const [newBase64, setNewBase64] = useState(prepareBase64(newCell));

  useEffect(() => {
    const addDiffs = async () => {
      console.log('useEffect calls addDiffs', showChanges);
      if (showChanges) {
        const addedBase64 = await addDifference(oldBase64, newBase64, 'added');
        setNewBase64(addedBase64);

        const removedBase64 = await addDifference(oldBase64, newBase64, 'removed');
        setOldBase64(removedBase64);
      } else {
        setOldBase64(prepareBase64(oldCell));
        setNewBase64(prepareBase64(newCell));
      }
    };

    addDiffs();
  }, [showChanges]);

  function getSidebySideDiff(oldCell: IDiffDetailProps, newCell: IDiffDetailProps): React.ReactNode {
    return (
      <div style={{ display: 'flex ' }}>
        <div
          style={{
            width: 'calc(50% - 14px)',
            borderRight: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)'
          }}
        >
          <img src={oldBase64} style={{ width: '100%' }} />
        </div>
        <div style={{ flexGrow: '1' }}>
          <img src={newBase64} style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  function getUnifiedDiff(oldCell: IDiffDetailProps, newCell: IDiffDetailProps): React.ReactNode {
    return <>Unified</>;
  }

  return (
    <div className={cx(classes.diffDetail)}>
      <div className={cx(classes.monacoOptions)}>
        <header>Diff View</header>
        <label>
          <input
            type="radio"
            value="side-by-side"
            checked={diffMode === 'side-by-side'}
            onChange={handleDiffModeChange}
          />
          Side-by-Side
        </label>
        <label>
          <input type="radio" value="unified" checked={diffMode === 'unified'} onChange={handleDiffModeChange} />
          Unified
        </label>

        <label>
          <input
            type="checkbox"
            checked={showChanges}
            onChange={handleHighlightChangesChange}
            style={{ marginTop: '1em' }}
          />
          Highlight Changes
        </label>
        <label>
          <input type="checkbox" checked={greyScale} onChange={handleGreyScaleChange} />
          Gresyscale
        </label>
      </div>
      <div className={cx(classes.monacoWrapper)}>
        <div className={cx(classes.monacoHeader)}>
          <div ref={leftHeader} style={{ width: 'calc(50% - 14px)' }}>
            v{oldCell.stateNo + 1},{' '}
            <relative-time datetime={oldCell.timestamp.toISOString()} precision="second">
              {oldCell.timestamp.toLocaleTimeString()} {oldCell.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
          <div style={{ flexGrow: '1' }}>
            v{newCell.stateNo + 1},{' '}
            <relative-time datetime={newCell.timestamp.toISOString()} precision="second">
              {newCell.timestamp.toLocaleTimeString()} {newCell.timestamp.toLocaleDateString()}
            </relative-time>
          </div>
        </div>
        {diffMode === 'side-by-side' ? getSidebySideDiff(oldCell, newCell) : getUnifiedDiff(oldCell, newCell)}
      </div>
    </div>
  );
};

/**
 *
 * @param color ranging from 0-255
 */
function sRGB2Lin(color: number) {
  const normalized = color / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  } else {
    return Math.pow((normalized + 0.055) / 1.055, 2.4);
  }
}

function lin2sRGB(linGrey: number) {
  if (linGrey <= 0.0031308) {
    return linGrey * 12.92 * 255;
  } else {
    return (1.055 * Math.pow(linGrey, 1 / 2.4) - 0.055) * 255;
  }
}
function prepareBase64(cellDiff: IDiffDetailProps) {
  let base64 = (cellDiff.cell as CodeCellProvenance).output.find(out => out.data?.['image/png'] !== undefined)?.data?.[
    'image/png'
  ];

  if (base64 !== undefined) {
    // append base64 header
    base64 = `data:image/png;base64,${base64}`;
  } else {
    // create empty base64 image
    base64 = 'data:null';
  }
  return base64;
}

const addDifference = async (oldBase64, newBase64, highlight) => {
  // if removed old is basis and what was removed is highlighted on it in red
  // if added, new is the bassis and what was added is highlighted in green
  // i.e., as for code
  const [base, compare] = highlight === 'removed' ? [oldBase64, newBase64] : [newBase64, oldBase64];

  const baseImg = new Image();
  baseImg.src = base;
  await baseImg.decode();

  const compareImg = new Image();
  compareImg.src = compare;
  await compareImg.decode();

  const diffCanvas = document.createElement('canvas');
  // canvas size based on base image, as this is the what is displayed (+ highlights from the compareImg)
  diffCanvas.width = baseImg.width;
  diffCanvas.height = baseImg.height;

  const ctx = diffCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(compareImg, 0, 0);
    const comapreImgData = ctx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
    grayscale(comapreImgData.data);
    // ctx.putImageData(comapreImgData, 0, 0);

    const compareImgPixelData = Array.from(comapreImgData.data);
    ctx.clearRect(0, 0, diffCanvas.width, diffCanvas.height);

    // draw baseImg on top of compareImg because we will get the base64 from canvas
    ctx.drawImage(baseImg, 0, 0);
    const baseImgData = ctx.getImageData(0, 0, diffCanvas.width, diffCanvas.height);
    grayscale(baseImgData.data);
    ctx.putImageData(baseImgData, 0, 0);

    // highlight added or removed content
    if (highlight === 'added') {
      console.log('highlight added');
      highlightDifference(ctx, baseImgData.data, compareImgPixelData, 1);
    } else if (highlight === 'removed') {
      console.log('highlight removed');
      highlightDifference(ctx, baseImgData.data, compareImgPixelData, 0);
    }

    ctx.putImageData(baseImgData, 0, 0);
    return diffCanvas.toDataURL();
  }
};

const grayscale = pixels => {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const grayScale = (r + g + b) / 3;
    pixels[i] = grayScale;
    pixels[i + 1] = grayScale;
    pixels[i + 2] = grayScale;
  }

  // const imgData = ctx.getImageData(0, 0, watermark.width, watermark.height);
  //       const pixels = imgData.data;
  //       for (let i = 0; i < pixels.length; i += 4) {
  //         // +4 --> skip alpha channel
  //         const r = pixels[i];
  //         const g = pixels[i + 1];
  //         const b = pixels[i + 2];
  //         // preceived brightness formulas need linear RGB values, so calling sRGB2Lin
  //         const linGrey = 0.2126 * sRGB2Lin(r) + 0.7152 * sRGB2Lin(g) + 0.0772 * sRGB2Lin(b);
  //         // convert back to sRGB
  //         const sRGBgrey = lin2sRGB(linGrey);
  //         pixels[i] = pixels[i + 1] = pixels[i + 2] = sRGBgrey;
  //       }
  //       ctx.putImageData(imgData, 0, 0);
};

const highlightDifference = (ctx, baseImgData, compareImgData, channel) => {
  // iterate over base img (will be annotated, thus is the reference)
  for (let i = 0; i < baseImgData.length; i += 4) {
    // find pixels that are missing in the compared image
    if (baseImgData[i] !== 255 && compareImgData[i] === 255) {
      baseImgData[i] = baseImgData[i + 1] = baseImgData[i + 2] = 0;
      baseImgData[i + channel] = 255;
    }
  }
};
