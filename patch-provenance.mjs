import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'node:crypto';

// Patch Trrack State
// Use case 1:
// Keep KE as author until October 10th
// October 16: Klaus
// October 17: Klaus Eckelt
// October 31: Klaus
// November 6th-9th: Klaus Eckelt
// November 27th: Klaus

const trrackFile = './notebooks/Use Case 2.trrack.json';

const provString = fs.readFileSync(trrackFile, 'utf8');
// parse JSON string to JSON object
const trrack = JSON.parse(provString);

if (!trrack || Object.keys(trrack.nodes).length <= 1) {
  console.log('no provenance');
  process.exit(0);
}

const klausEckeltUserMetaData = {
  username: 'keckelt',
  name: 'Klaus Eckelt',
  displayName: 'Klaus Eckelt',
  initials: 'KE',
  avatar_url: `https://www.gravatar.com/avatar/${createHash('sha256')
    .update('klaus.eckelt@gmail.com')
    .digest('hex')}?d=identicon`,
  color: '#111111'
};

const klausUserMetaData = {
  username: 'klaus',
  name: 'Klaus',
  displayName: 'Klaus',
  initials: 'K',
  avatar_url: `https://www.gravatar.com/avatar/${createHash('sha256')
    .update('klaus@eckelt.info')
    .digest('hex')}?d=identicon`,
  color: '#111111'
};

let i = 0;
for (const node of Object.values(trrack.nodes)) {
  if (i > 7) {
    node.meta['loops-executing-user'][0].val = klausUserMetaData;
    console.log('replace user');
  }
  i++;
}

//console.log(JSON.stringify(trrack, null, 2));
fs.writeFileSync(trrackFile, JSON.stringify(trrack, null, 2));
