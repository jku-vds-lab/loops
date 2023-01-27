import { EventType } from '../Provenance/notebook-provenance';
import { EventConfig } from '@jku-icg/trrack-notebook-vis';

import { symbol, symbolCircle, symbolCross, symbolTriangle } from 'd3-shape';
import * as React from 'react';
import { style } from 'typestyle';

/**
 * Setup event configuration for ProvVis
 * @returns the event config
 */
export function createEventConfig(): EventConfig<EventType> {
  function changeSymbol(current: boolean) {
    return (
      <path
        strokeWidth={2}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        d={symbol().type(symbolCircle)()!}
      />
    );
  }

  function executeSymbol(current: boolean) {
    return (
      <path
        strokeWidth={30}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        transform="scale (0.035) translate (-250,-250)"
        d="M471.99 334.43L336.06 256l135.93-78.43c7.66-4.42 10.28-14.2 5.86-21.86l-32.02-55.43c-4.42-7.65-14.21-10.28-21.87-5.86l-135.93 78.43V16c0-8.84-7.17-16-16.01-16h-64.04c-8.84 0-16.01 7.16-16.01 16v156.86L56.04 94.43c-7.66-4.42-17.45-1.79-21.87 5.86L2.15 155.71c-4.42 7.65-1.8 17.44 5.86 21.86L143.94 256 8.01 334.43c-7.66 4.42-10.28 14.21-5.86 21.86l32.02 55.43c4.42 7.65 14.21 10.27 21.87 5.86l135.93-78.43V496c0 8.84 7.17 16 16.01 16h64.04c8.84 0 16.01-7.16 16.01-16V339.14l135.93 78.43c7.66 4.42 17.45 1.8 21.87-5.86l32.02-55.43c4.42-7.65 1.8-17.43-5.86-21.85z"
      />
    );
  }

  function addSymbol(current: boolean) {
    return (
      <path
        strokeWidth={2}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        d={symbol().type(symbolCross).size(125)()!}
      />
    );
  }

  function removeSymbol(current: boolean) {
    return (
      <path
        strokeWidth={30}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        transform="scale (0.035) translate (-220,-220)"
        d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"
      />
    );
  }

  function moveSymbol(current: boolean) {
    return (
      <path
        strokeWidth={30}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        transform="scale (0.035) translate (-260,-260)"
        d="M352.201 425.775l-79.196 79.196c-9.373 9.373-24.568 9.373-33.941 0l-79.196-79.196c-15.119-15.119-4.411-40.971 16.971-40.97h51.162L228 284H127.196v51.162c0 21.382-25.851 32.09-40.971 16.971L7.029 272.937c-9.373-9.373-9.373-24.569 0-33.941L86.225 159.8c15.119-15.119 40.971-4.411 40.971 16.971V228H228V127.196h-51.23c-21.382 0-32.09-25.851-16.971-40.971l79.196-79.196c9.373-9.373 24.568-9.373 33.941 0l79.196 79.196c15.119 15.119 4.411 40.971-16.971 40.971h-51.162V228h100.804v-51.162c0-21.382 25.851-32.09 40.97-16.971l79.196 79.196c9.373 9.373 9.373 24.569 0 33.941L425.773 352.2c-15.119 15.119-40.971 4.411-40.97-16.971V284H284v100.804h51.23c21.382 0 32.09 25.851 16.971 40.971z"
      />
    );
  }

  function setSymbol(current: boolean) {
    return (
      <path
        strokeWidth={2}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        d={symbol().type(symbolTriangle).size(100)()!}
      />
    );
  }

  function changeCellValueSymbol(current: boolean) {
    return (
      <path
        strokeWidth={30}
        className={style({
          fill: current ? 'rgb(33, 133, 208)' : 'white',
          stroke: 'rgb(33, 133, 208)'
        })}
        transform="scale (0.035) translate (-260,-260)"
        d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"
      />
    );
  }

  const conf: EventConfig<EventType> = {};
  for (const j in EventType) {
    conf[j] = {};
  }

  // change
  conf[EventType.activeCell].backboneGlyph = changeSymbol(false);
  conf[EventType.activeCell].currentGlyph = changeSymbol(true);
  conf[EventType.activeCell].bundleGlyph =
    conf[EventType.activeCell].backboneGlyph;
  conf[EventType.activeCell].regularGlyph =
    conf[EventType.activeCell].backboneGlyph;
  conf[EventType.activeCell].description = 'The active cell has been changed';

  // execute
  conf[EventType.executeCell].backboneGlyph = executeSymbol(false);
  conf[EventType.executeCell].currentGlyph = executeSymbol(true);
  conf[EventType.executeCell].bundleGlyph =
    conf[EventType.executeCell].backboneGlyph;
  conf[EventType.executeCell].regularGlyph =
    conf[EventType.executeCell].backboneGlyph;
  conf[EventType.executeCell].description = 'A cell has been executed';

  // add
  conf[EventType.addCell].backboneGlyph = addSymbol(false);
  conf[EventType.addCell].currentGlyph = addSymbol(true);
  conf[EventType.addCell].bundleGlyph = conf[EventType.addCell].backboneGlyph;
  conf[EventType.addCell].regularGlyph = conf[EventType.addCell].backboneGlyph;
  conf[EventType.addCell].description = 'A new cell has been added';

  // remove
  conf[EventType.removeCell].backboneGlyph = removeSymbol(false);
  conf[EventType.removeCell].currentGlyph = removeSymbol(true);
  conf[EventType.removeCell].bundleGlyph =
    conf[EventType.removeCell].backboneGlyph;
  conf[EventType.removeCell].regularGlyph =
    conf[EventType.removeCell].backboneGlyph;
  conf[EventType.removeCell].description = 'A cell has been removed';

  // move
  conf[EventType.moveCell].backboneGlyph = moveSymbol(false);
  conf[EventType.moveCell].currentGlyph = moveSymbol(true);
  conf[EventType.moveCell].bundleGlyph = conf[EventType.moveCell].backboneGlyph;
  conf[EventType.moveCell].regularGlyph =
    conf[EventType.moveCell].backboneGlyph;
  conf[EventType.moveCell].description = 'A cell has been moved';

  // set
  conf[EventType.setCell].backboneGlyph = setSymbol(false);
  conf[EventType.setCell].currentGlyph = setSymbol(true);
  conf[EventType.setCell].bundleGlyph = conf[EventType.setCell].backboneGlyph;
  conf[EventType.setCell].regularGlyph = conf[EventType.setCell].backboneGlyph;
  conf[EventType.setCell].description = 'The type of a cell has been changed';

  // changeCellValue
  conf[EventType.changeCellValue].backboneGlyph = changeCellValueSymbol(false);
  conf[EventType.changeCellValue].currentGlyph = changeCellValueSymbol(true);
  conf[EventType.changeCellValue].bundleGlyph =
    conf[EventType.changeCellValue].backboneGlyph;
  conf[EventType.changeCellValue].regularGlyph =
    conf[EventType.changeCellValue].backboneGlyph;
  conf[EventType.changeCellValue].description =
    'The value of a cell has been changed';

  return conf;
}
