import React, { useEffect, useRef } from 'react';
import { Vega, VisualizationSpec } from 'react-vega';
import { throttleAndDebounce } from '../util';
import { useLoopsStore } from '../LoopsStore';

export function TimeAxis(): JSX.Element {
  const containerRef = useRef(null);

  const stateData = useLoopsStore(state => state.stateData);
  const executionData: { date: Date; cellExecutions: number; isVisible: boolean }[] = Array.from(stateData.values());

  useEffect(() => {
    // call the resize event at most every 100ms and debounce it
    const delayedResize = throttleAndDebounce(
      () => {
        window.dispatchEvent(new Event('resize')); // trigger a resize event to update the vega-lite chart width
      },
      100,
      100
    ); // throttle time and debounce time in ms

    const resizeObserver = new ResizeObserver(delayedResize);
    const observedContainer = containerRef.current;

    if (observedContainer) {
      resizeObserver.observe(observedContainer);
    }

    return () => {
      if (observedContainer) {
        resizeObserver.unobserve(observedContainer);
      }
    };
  }, []);

  // add a resizeobserver to the div that fires when it gets resized
  // this is a workaround for the vega-lite width property not updating when the container size changes

  return executionData.length > 1 ? (
    <div
      ref={containerRef}
      style={{ width: '100%', paddingTop: '2px', borderTop: '1px solid var(--jp-toolbar-border-color)' }}
    >
      <Vega spec={getBarSpec(executionData)} actions={false} style={{ width: '100%' }} />
    </div>
  ) : (
    <> </>
  );
}

const getBarSpec = executionData => {
  // get date of first and last executionData
  const firstDate = executionData[0].date;
  const lastDate = executionData.at(-1).date;

  // get the number of milliseconds between the first and last date
  const dateDifference = lastDate.getTime() - firstDate.getTime();

  // Set timeUnit according to time Range
  // * less than 1 hour: 'minute'
  // * less than 2 days: 'hour'
  // * less than 2 months: yearmonthdate
  // * else yearMonth
  let timeUnit = 'yearMonth';
  if (dateDifference < 60 * 60 * 1000) {
    timeUnit = 'hoursminutesseconds';
  } else if (dateDifference < 2 * 24 * 60 * 60 * 1000) {
    timeUnit = 'dayhours';
  } else if (dateDifference < 2 * 30 * 24 * 60 * 60 * 1000) {
    timeUnit = 'monthdate';
  }

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: executionData
    },
    width: 'container',
    height: 25,
    padding: { bottom: 0, top: 0, left: 5, right: 5 },
    view: { stroke: null },
    encoding: {
      x: {
        field: 'date',
        title: '',
        type: 'temporal',
        axis: {
          grid: false,
          labelFlush: true,
          labelAngle: 0,
          tickBand: 'center',
          tickExtra: true,
          labelOverlap: 'greedy'
          // labelExpr: "timeFormat(datum.value, '%b %d')"
          // values: [ // TODO set values according to where labels should be placed
          //   1696578026134, 1697534180510, 1697436168008, 1698746134246, 1699270720827, 1699517443585, 1701070650281
          // ]
        },
        scale: { nice: false }
        // timeUnit
      },
      y: {
        field: 'cellExecutions',
        title: null,
        type: 'quantitative',
        axis: false, //{ grid: false },
        scale: { type: 'linear', nice: false },
        stack: 'zero',
        aggregate: 'sum'
      }
    },
    layer: [
      {
        // TODO does not work in all cases
        transform: [{ filter: 'datum.isVisible' }, { extent: 'date', param: 'date_extent' }],
        mark: {
          type: 'rect',
          opacity: 0.6,
          color: '#dedede'
        },
        encoding: {
          x: { value: { expr: "scale('x', date_extent[0])-5" } },
          x2: { value: { expr: "scale('x', date_extent[1])+5" } },
          y2: { value: 25 },
          y: { value: -5 }
        }
      },
      {
        mark: { type: 'bar', opacity: 1, color: '#bbb', tooltip: true },
        encoding: {}
      },
      {
        transform: [{ filter: 'datum.isVisible' }],
        mark: {
          type: 'bar',
          opacity: 1,
          color: '#333',
          tooltip: true
        },
        encoding: {}
      }
    ]
  } as VisualizationSpec;
  return spec;
};
