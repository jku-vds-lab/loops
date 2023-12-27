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

const userMetaData = {
  username: 'keckelt',
  name: 'Klaus Eckelt',
  displayName: 'Klaus Eckelt',
  initials: 'KE',
  avatar_url:
    'https://www.gravatar.com/avatar/7bc04b95eacfc50cb6b5f425fcf835c9b274b50f67617d3fd5fa7b3f59188ec2?d=identicon',
  color: '#111111'
};

const metaData = {
  '8bc259dd-8bea-48c4-9bac-86da3c8e977b': {
    'loops-executed-cell-id': 'ffd16400-c776-482c-823f-94884c1b6693',
    'loops-state': ['first-state']
  },
  '550a9873-e023-4b69-8492-dbda18d3fb32': {
    'loops-executed-cell-id': 'bd9f2328-6c62-4f1e-b2ca-afe37a234602',
    'loops-state': []
  },
  'f8432dc8-ddf7-4a2c-a65a-b004f23864d1': {
    'loops-executed-cell-id': '29a03ace-6e89-4867-9dd3-2cdb8e411fa0',
    'loops-state': []
  },
  '1a89236f-f864-42ee-9868-3059ba570342': {
    'loops-executed-cell-id': '30919a73-fa43-4fd4-a310-77f9d8a6103e',
    'loops-state': []
  },
  'fd3c3783-372c-494f-9383-79d511551593': {
    'loops-executed-cell-id': '4768df09-146b-4bcb-947d-78ab147a5843',
    'loops-state': []
  },
  'a71020d2-281e-4ef9-933f-f6cbc7a86780': {
    'loops-executed-cell-id': '82340128-d0c9-4cc0-8d57-3df827472bb4',
    'loops-state': []
  },
  '74965543-f871-42a9-a867-e621345dcc3a': {
    'loops-executed-cell-id': '13892e99-8b4b-46bf-8ef2-d81d6fabfafe',
    'loops-state': []
  },
  '9153423f-e75f-4069-be0d-8a62b8f8530d': {
    'loops-executed-cell-id': '0f5f040f-2187-4d2e-943e-ec9f0164cc38',
    'loops-state': []
  },
  '00d9025e-83d3-4e05-ae8b-fed4c774b3f1': {
    'loops-executed-cell-id': '30dfa281-338c-458f-8fce-f3a9f29c371e',
    'loops-state': []
  },
  '23775b0b-5d46-4b3c-8fa1-daeeebc38042': {
    'loops-executed-cell-id': '1b4cf25c-52e9-4cf5-aa0e-b801df559226',
    'loops-state': []
  },
  '6b5f9e19-3e10-41e9-bbd4-62983421909d': {
    'loops-executed-cell-id': 'ffd16400-c776-482c-823f-94884c1b6693',
    'loops-state': ['out-of-order']
  },
  '863f8f65-233f-4dcf-813e-357e89694794': {
    'loops-executed-cell-id': 'e57d2cab-f31a-46db-9c3a-9db9c38a19b4',
    'loops-state': []
  },
  '04ba41c6-00f1-4491-bed9-225ea2625e58': {
    'loops-executed-cell-id': '82340128-d0c9-4cc0-8d57-3df827472bb4',
    'loops-state': []
  },
  '0a400090-99a5-46cb-8e8c-a92f2ebc690a': {
    'loops-executed-cell-id': '13892e99-8b4b-46bf-8ef2-d81d6fabfafe',
    'loops-state': []
  },
  '39342e70-2965-417a-a2ce-33dde0b73703': {
    'loops-executed-cell-id': '0f5f040f-2187-4d2e-943e-ec9f0164cc38',
    'loops-state': []
  },
  '2167eaba-980c-4458-bf37-fa16bfd06540': {
    'loops-executed-cell-id': '30dfa281-338c-458f-8fce-f3a9f29c371e',
    'loops-state': []
  },
  '315be810-af66-4f5e-910c-bc66734b6242': {
    'loops-executed-cell-id': '1b4cf25c-52e9-4cf5-aa0e-b801df559226',
    'loops-state': []
  }
};

for (const node of Object.values(trrack.nodes)) {
  const metaDataAvailable = Object.keys(metaData).includes(node.id);
  console.log('is it part of the data?', metaDataAvailable);
  if (!metaDataAvailable) {
    continue;
  }

  const newStateMeta = {
    'loops-state': [
      {
        type: 'loops-state',
        id: uuidv4(),
        val: metaData[node.id]['loops-state'][0] ? [metaData[node.id]['loops-state'][0]] : [],
        createdOn: node.createdOn
      }
    ]
  };

  const newActiveCellMeta = {
    'loops-executed-cell-id': [
      {
        type: 'loops-executed-cell-id',
        id: uuidv4(),
        val: metaData[node.id]['loops-executed-cell-id'],
        createdOn: node.createdOn
      }
    ]
  };

  const newUserIdMeta = {
    'loops-executing-user': [
      {
        type: 'loops-executing-user',
        id: uuidv4(),
        val: userMetaData,
        createdOn: node.createdOn
      }
    ]
  };

  node.meta = {
    ...node.meta,
    ...newStateMeta,
    ...newActiveCellMeta,
    ...newUserIdMeta
  };
}

console.log(JSON.stringify(trrack, null, 2));
fs.writeFileSync(trrackFile, JSON.stringify(trrack, null, 2));
