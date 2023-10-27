import HtmlDiff from '@armantang/html-diff';
import parse from 'html-react-parser';
import React, { useRef, useState } from 'react';
import { useStyles } from './DiffDetail';

export interface IHTMLDiffProps {
  newCell: IHTMLDiffDetailProps;
  oldCell: IHTMLDiffDetailProps;
}

export interface IHTMLDiffDetailProps {
  html: string[];
  stateNo: number;
  timestamp: Date;
}

export const HTMLDiff = ({ newCell, oldCell }: IHTMLDiffProps) => {
  const { classes, cx } = useStyles();
  const leftHeader = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState('side-by-side');
  const handleDiffModeChange = event => {
    setDiffMode(event.target.value);
  };

  const unifiedDiffHTML: JSX.Element[] = [];
  const sideBySideDiffHTMLOld: JSX.Element[] = [];
  const sideBySideDiffHTMLNew: JSX.Element[] = [];

  // could be multiple outputs
  newCell.html.map((newOutput, outputIndex) => {
    const oldOutput = oldCell.html[outputIndex];
    const diff = new HtmlDiff(oldOutput, newOutput);

    const unifiedDiff = diff.getUnifiedContent();
    unifiedDiffHTML.push(parse(unifiedDiff) as JSX.Element);

    const sideBySideDiff = diff.getSideBySideContents();
    sideBySideDiffHTMLOld.push(parse(sideBySideDiff[0]) as JSX.Element);
    sideBySideDiffHTMLNew.push(parse(sideBySideDiff[1]) as JSX.Element);
  });

  function getSidebySideDiff(): React.ReactNode {
    return (
      <div style={{ display: 'flex' }}>
        <div
          style={{
            flexGrow: 1,
            flexShrink: 1,
            borderRight: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)'
          }}
        >
          {sideBySideDiffHTMLOld}
        </div>
        <div
          style={{
            flexGrow: 1,
            flexShrink: 1
          }}
        >
          {sideBySideDiffHTMLNew}
        </div>
      </div>
    );
  }

  function getUnifiedDiff(): React.ReactNode {
    return <div style={{}}>{unifiedDiffHTML}</div>;
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
        {diffMode === 'side-by-side' ? getSidebySideDiff() : getUnifiedDiff()}
      </div>
    </div>
  );
};
