import React, { useEffect, useRef, useState } from 'react';
import { useStyles } from './DiffDetail';
import { IHTMLDiffProps } from './HTMLDiff';
import { tabletojson } from 'tabletojson';
import * as d3 from 'd3-selection';
import { makePlural } from '../util';
import { IconAlertTriangle } from '@tabler/icons-react';

export const TacoDiff = ({ newCell, oldCell }: IHTMLDiffProps) => {
  const { classes, cx } = useStyles();
  const leftHeader = useRef<HTMLDivElement>(null);

  const [diffMode, setDiffMode] = useState('side-by-side');
  const handleDiffModeChange = event => {
    setDiffMode(event.target.value);
  };

  const [totalRowChanges, setTotalRowChanges] = React.useState(0);
  const [totalColChanges, setTotalColumnChanges] = React.useState(0);

  const [rowChanges, setRowChanges] = React.useState(0);
  const [colChanges, setColumnChanges] = React.useState(0);
  const [cellChanges, setCellChanges] = React.useState(0);

  const unifiedParent = useRef<HTMLDivElement>(null);
  const sideOldParent = useRef<HTMLDivElement>(null);
  const sideNewParent = useRef<HTMLDivElement>(null);

  // could be multiple outputs
  useEffect(() => {
    newCell.html.map((newOutput, outputIndex) => {
      const oldOutput = oldCell.html[outputIndex];
      const newTable = tabletojson.convert(newOutput, { useFirstRowForHeadings: true });
      const oldTable = tabletojson.convert(oldOutput, { useFirstRowForHeadings: true });

      //unified
      const summary = createSummaryVisualization(
        unifiedParent.current,
        oldTable[0],
        newTable[0],
        true,
        true,
        '#66C2A5',
        '#F05268'
      );
      setRowChanges(summary.rowChanges);
      setColumnChanges(summary.colChanges);
      setCellChanges(summary.cellChanges);

      //side-by-side
      createSummaryVisualization(sideNewParent.current, newTable[0], oldTable[0], false, true, '#F05268', '#66C2A5');
      createSummaryVisualization(sideOldParent.current, oldTable[0], newTable[0], false, true);

      const rowChange = oldOutput
        ? Number(newOutput.match(/(\d+) rows/)?.[1] ?? 0) - Number(oldOutput.match(/(\d+) rows/)?.[1] ?? 0)
        : 0;
      setTotalRowChanges(rowChange);

      const colChange = oldOutput
        ? Number(newOutput.match(/(\d+) columns/)?.[1] ?? 0) - Number(oldOutput.match(/(\d+) columns/)?.[1] ?? 0)
        : 0;
      setTotalColumnChanges(colChange);
    });
  }, [newCell.html, oldCell.html]);

  function getSidebySideDiff(show: boolean): React.ReactNode {
    return (
      <div style={{ display: show ? 'grid' : 'none', gridTemplateColumns: '1fr 0.5em 0.5em 1fr' }}>
        <div
          style={{
            overflowX: 'scroll'
          }}
          ref={sideOldParent}
        >
          {/* filled by effect */}
        </div>
        <div
          style={{
            borderRight: 'calc(2 * var(--jp-border-width)) solid var(--jp-toolbar-border-color)'
          }}
        ></div>
        <div></div>
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
        <header>Data Diff View</header>
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
        <span style={{ fontWeight: 600, marginTop: '1em' }}>Visible Changes</span>
        <span style={{ background: rowChanges === 0 ? 'inherit' : rowChanges > 0 ? '#66C2A5' : '#F05268' }}>
          {(rowChanges < 0 ? '' : '+') + rowChanges + makePlural(' row', rowChanges)}
        </span>
        <span style={{ background: colChanges === 0 ? 'inherit' : colChanges > 0 ? '#66C2A5' : '#F05268' }}>
          {(colChanges < 0 ? '' : '+') + colChanges + makePlural(' column', colChanges)}
        </span>
        <span style={{ background: cellChanges !== 0 ? '#FBE156' : 'inherit' }}>
          {cellChanges + makePlural(' changed cell', cellChanges)}
        </span>

        {totalRowChanges || totalColChanges ? (
          <span style={{ fontWeight: 600, marginTop: '1em' }}>
            <IconAlertTriangle size={15}></IconAlertTriangle> Total Changes
          </span>
        ) : (
          <></>
        )}
        {totalRowChanges ? (
          <span style={{ color: totalRowChanges > 0 ? '#66C2A5' : '#F05268' }}>
            {(totalRowChanges < 0 ? '' : '+') + totalRowChanges + makePlural(' row', totalRowChanges)}
          </span>
        ) : (
          <> </>
        )}
        {totalColChanges ? (
          <span style={{ color: totalColChanges > 0 ? '#66C2A5' : '#F05268' }}>
            {(totalColChanges < 0 ? '' : '+') + totalColChanges + makePlural(' column', totalColChanges)}
          </span>
        ) : (
          <> </>
        )}
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

export function createSummaryVisualizationFromHTML(
  html,
  referenceHTML,
  showAdded = true,
  showRemoved = true,
  addColor = '#66C2A5',
  removeColor = '#F05268',
  showContent = true
) {
  const newTable = tabletojson.convert(html, { useFirstRowForHeadings: true });
  let oldTable = referenceHTML ? tabletojson.convert(referenceHTML, { useFirstRowForHeadings: true }) : [];

  //HTML includes a p tag that summarizes the size of the data, e.g., "5 rows × 642 columns"
  // extract rows and columns from html and referenceHTML
  // summarize changes in p tag
  const rowChange = referenceHTML
    ? (html.match(/(\d+) rows/)?.[1] ?? 0) - (referenceHTML.match(/(\d+) rows/)?.[1] ?? 0)
    : 0;
  const colChange = referenceHTML
    ? (html.match(/(\d+) columns/)?.[1] ?? 0) - (referenceHTML.match(/(\d+) columns/)?.[1] ?? 0)
    : 0;

  if (oldTable.length === 0) {
    oldTable = [[]]; // no tables, no rows
  }

  const summary = createSummaryVisualization(
    undefined,
    newTable[0],
    oldTable[0],
    showAdded,
    showRemoved,
    addColor,
    removeColor,
    showContent
  ).node;

  if (rowChange !== 0 || colChange !== 0) {
    const pTag = document.createElement('p');
    pTag.style.fontSize = '0.66em';
    const rowSpan = document.createElement('span');
    // set background to green if rowChange > 0, red if < 0, black if 0
    rowSpan.style.background = rowChange === 0 ? 'inherit' : rowChange > 0 ? '#66C2A5' : '#F05268';
    rowSpan.innerText = `${(rowChange < 0 ? '' : '+') + rowChange} rows`;
    const colSpan = document.createElement('span');
    colSpan.style.background = colChange === 0 ? 'inherit' : colChange > 0 ? '#66C2A5' : '#F05268';
    colSpan.innerText = `${(colChange < 0 ? '' : '+') + colChange} columns`;

    pTag.appendChild(rowSpan);
    pTag.appendChild(document.createTextNode(', '));
    pTag.appendChild(colSpan);
    //add p tag to summary div node
    summary.appendChild(pTag);
  }
  return summary;
}

export function createSummaryVisualization(
  ref,
  data,
  referenceData,
  showAdded = true,
  showRemoved = true,
  addColor = '#66C2A5',
  removeColor = '#F05268',
  showContent = true
): { node: HTMLDivElement; rowChanges: number; colChanges: number; cellChanges: number } {
  console.log('Create data diff');
  const columns = Object.keys(data[0]);
  const referenceColumns = referenceData.length > 0 ? Object.keys(referenceData[0]) : [];

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

  let wrapper;
  if (ref) {
    wrapper = d3.select(ref).append('div');
  } else {
    wrapper = d3.create('div');
  }

  const summaryGrid = wrapper.append('div');

  const summary = {
    node: wrapper.node(),
    rowChanges: addedRows.length,
    colChanges: -removedColumns.length + addedColumns.length,
    cellChanges: 0
  };

  // Create an div element
  summaryGrid
    .style('display', 'grid')
    .style('grid-template-columns', `repeat(${allColumns.length}, ${showContent ? 'minmax(min-content, 1fr)' : '1fr'})`)
    .style('grid-template-rows', `repeat(${data.concat(addedRows).length}, auto)`)
    .style('gap', showContent ? '3px' : '1px')
    .style('width', 'auto');

  // Create groups for each row
  const rows = summaryGrid
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
        summary.cellChanges++;
        return '#FBE156'; // changed cell
      }
      return '#F5F5F5'; // Unchanged cells
    });

  return summary;
}

// check if the output is a pandas dataframe
export function hasDataframe(output: string | undefined) {
  if (output === undefined) {
    return false;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(output, 'text/html');
  // dataframe HTML output contains a table classed "dataframe"
  const df = doc.querySelector('table.dataframe');
  return df !== null;
}
