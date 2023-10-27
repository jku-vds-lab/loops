import React, { useEffect, useRef, useState } from 'react';
import { useStyles } from './DiffDetail';
import { IHTMLDiffProps } from './HTMLDiff';
import { tabletojson } from 'tabletojson';
import * as d3 from 'd3-selection';

export const TacoDiff = ({ newCell, oldCell }: IHTMLDiffProps) => {
  const { classes, cx } = useStyles();
  const leftHeader = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState('side-by-side');
  const handleDiffModeChange = event => {
    setDiffMode(event.target.value);
  };

  const unifiedParent = useRef<HTMLDivElement>(null);
  const sideOldParent = useRef<HTMLDivElement>(null);
  const sideNewParent = useRef<HTMLDivElement>(null);

  // could be multiple outputs
  useEffect(() => {
    newCell.html.map((newOutput, outputIndex) => {
      const oldOutput = oldCell.html[outputIndex];
      const newTable = tabletojson.convert(newOutput, { useFirstRowForHeadings: true });
      const oldTable = tabletojson.convert(oldOutput, { useFirstRowForHeadings: true });

      createSummaryVisualization(unifiedParent.current, newTable[0], oldTable[0], true, true, '#66C2A5', '#F05268');
      createSummaryVisualization(sideNewParent.current, newTable[0], oldTable[0], false, true, '#F05268', '#66C2A5');
      createSummaryVisualization(sideOldParent.current, oldTable[0], newTable[0], false, true);
    });
  }, []);

  function getSidebySideDiff(show: boolean): React.ReactNode {
    return (
      <div style={{ display: show ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr' }}>
        <div
          style={{
            overflowX: 'scroll',
            borderRight: 'var(--jp-border-width) solid var(--jp-toolbar-border-color)'
          }}
          ref={sideOldParent}
        >
          {/* filled by effect */}
        </div>
        <div
          style={{
            overflowX: 'scroll'
          }}
          ref={sideNewParent}
        >
          {/* filled by effect */}
        </div>
      </div>
    );
  }

  function getUnifiedDiff(show: boolean): React.ReactNode {
    return (
      <div style={{ display: show ? 'block' : 'none', overflowX: 'scroll' }} ref={unifiedParent}>
        {/* filled by effect */}
      </div>
    );
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
        {getSidebySideDiff(diffMode === 'side-by-side')}
        {getUnifiedDiff(diffMode === 'unified')}
      </div>
    </div>
  );
};

function createSummaryVisualization(
  ref,
  data,
  referenceData,
  showAdded = true,
  showRemoved = true,
  addColor = '#66C2A5',
  removeColor = '#F05268',
  showContent = true
) {
  const columns = Object.keys(data[0]);
  const referenceColumns = Object.keys(referenceData[0]);

  // Determine added and removed columns
  const addedColumns = referenceColumns.filter(column => !columns.includes(column));
  const removedColumns = columns.filter(column => !referenceColumns.includes(column));

  // Determine added and removed rows
  const addedRows = showAdded ? referenceData.slice(data.length) : [];
  // const removedRows = showRemoved ? data.slice(referenceData.length) : []; //checked via added rows (= referenceData has more rows )

  // Create an array of all columns
  let allColumns = Array.from(new Set([...columns, ...referenceColumns]));

  if (!showAdded) {
    allColumns = allColumns.filter(column => !addedColumns.includes(column));
  }
  if (!showRemoved) {
    allColumns = allColumns.filter(column => !removedColumns.includes(column));
  }

  // Create an div element
  const div = d3.select(ref).append('div');
  div
    .style('display', 'grid')
    .style('grid-template-columns', `repeat(${allColumns.length}, ${showContent ? 'minmax(min-content, 1fr)' : '1fr'})`)
    .style('grid-template-rows', `repeat(${data.concat(addedRows).length}, auto)`)
    .style('gap', '1px')
    .style('width', 'auto');

  // Create groups for each row
  const rows = div
    .selectAll('div.row')
    .data(data.concat(addedRows)) // Include added rows
    .enter()
    .append('div')
    .classed('row', true)
    .style('display', 'grid')
    .style('grid-column', '1 / -1')
    .style('grid-template-columns', 'subgrid')
    .style('grid-template-rows', 'subgrid');

  // Create rectangles for each cell within the rows
  rows
    .selectAll('div.cell')
    .data((d, i) => {
      return allColumns.map(column => {
        if (i < data.length) {
          // original rows
          return { column: column, value: d[column], rowIndex: i };
        } else {
          // new rows
          return {
            column: column,
            value: referenceData[i][column],
            rowIndex: i
          };
        }
      });
    })
    .enter()
    .append('div')
    .classed('cell', true)
    .style('aspect-ratio', showContent ? '' : '1 / 1')
    .style('min-width', '1px')
    .style('min-height', '1px')
    .style('text-overflow', 'clip')
    .style('overflow', 'hidden')
    .style('white-space', 'nowrap')
    .style('font-size', '0.66em')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('align-items', 'start')
    .style('justify-content', 'center')
    .attr('title', d => d.value)
    .html(d => {
      if (!showContent) {
        return;
      }

      if (removedColumns.includes(d.column)) {
        //  return `
        //   <s>${referenceData[d.rowIndex]?.[d.column]}</s>
        // `
      } else if (addedColumns.includes(d.column)) {
        //NOOP
      } else if (d.rowIndex >= data.length) {
        //NOOP
      } else if (d.rowIndex >= referenceData.length) {
        //  return `
        //   <s>${referenceData[d.rowIndex]?.[d.column]}</s>
        // `
      } else if (d.value !== referenceData[d.rowIndex]?.[d.column]) {
        return `
          <s>${referenceData[d.rowIndex]?.[d.column]}</s>
          <span>${d.value}</span>
        `;
      }
      return d.value;
    })
    .style('background', d => {
      //TODO cells of added columns for removed rows white
      // TODO cells of removed columns for added rows white
      if (removedColumns.includes(d.column)) {
        return removeColor; // Removed column
      } else if (addedColumns.includes(d.column)) {
        return addColor; // Added column
      } else if (d.rowIndex >= data.length) {
        return addColor; // Added row
      } else if (d.rowIndex >= referenceData.length) {
        return removeColor; // removed row
      } else if (d.value !== referenceData[d.rowIndex]?.[d.column]) {
        return '#FBE156'; // changed cell
      }
      return '#F5F5F5'; // Unchanged cells
    });
}
