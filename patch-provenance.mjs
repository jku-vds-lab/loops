// import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Patch Trrack State
// 1. add state metadata
// 2. add active cell metadata
// 3. add user meta data

const trrackFile = './notebooks/Use Case 2.trrack.json';

const provString = fs.readFileSync(trrackFile, 'utf8');
// parse JSON string to JSON object
const trrack = JSON.parse(provString);

if (!trrack || Object.keys(trrack.nodes).length <= 1) {
  console.log('no provenance');
  process.exit(0);
}

console.log('happy days! provenance loaded');

const firststateID = '5b1b1029-006e-4f56-81b1-14dc24ed6215';
const outofOrderStateIDs = ['', ''];

const stateIdExecutedCellMap = {};

const userMetaData = {};
