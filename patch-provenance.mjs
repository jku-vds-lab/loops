// import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Patch Trrack State
// 1. add state metadata
// 2. add active cell metadata
// 3. add user meta data

const trrackFile = './notebooks/Use Case 1.trrack.json';

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
  '58f3c911-daf0-4959-83e9-2c3adcb4e28d': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['first-state']
  },
  '75bdf22f-6038-4576-ab16-5ea4ff2c9f74': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  '5dbd527d-bf4e-4809-8df3-e3cdf6d2e644': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  '7dcb5eb4-a535-4b5f-8d99-13a4fbbf2a83': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': []
  },
  'a4024502-d857-4350-9dd2-246bad1338b6': {
    'loops-executed-cell-id': '7f1fb6f4-5d0f-4321-80f9-4da3d1dccb37',
    'loops-state': []
  },
  '1f73ee56-9583-4c91-bd02-fca17401762b': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  '7703b546-246c-41e7-870d-d33c5bfe1ec6': {
    'loops-executed-cell-id': '8ef4181b-3b94-4445-ae1d-25e82f12e7ed',
    'loops-state': []
  },
  'b642a947-4dbc-41c1-9467-487ada199e58': {
    'loops-executed-cell-id': '8ed2f19c-6924-4a2c-93d7-b896d8e879a1',
    'loops-state': []
  },
  'f07c229a-6cab-47fc-ade6-c2cfad78e35a': {
    'loops-executed-cell-id': 'cd3b0587-88bf-4bd6-9d2d-79170e239130',
    'loops-state': []
  },
  '56e898e4-473f-453d-b820-14bc15ad3f85': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': ['out-of-order']
  },
  'cc872e70-07af-4983-af7e-fae7453636d8': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  '1bb708f6-9a41-452b-a74f-1de368ebe881': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  '31af91ea-a9e9-4af6-ab8c-9d3383976f58': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  '952e9624-a2f7-4dc0-8506-b6fabb16c8be': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'b85258b5-e012-48fd-9311-633f3d3cc067': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '2f924ec0-9983-4788-9b91-b7659d576927': {
    'loops-executed-cell-id': '57b46720-b920-483f-a993-7366150e72ec',
    'loops-state': []
  },
  '4626e0a2-915f-4f77-8154-7ac6ba376184': {
    'loops-executed-cell-id': '57b46720-b920-483f-a993-7366150e72ec',
    'loops-state': []
  },
  '36ebb39a-a424-4b52-8e53-6a3d6e2a9975': {
    'loops-executed-cell-id': '57b46720-b920-483f-a993-7366150e72ec',
    'loops-state': []
  },
  'b3196f29-97d7-4190-8c8c-2fff54d3083e': {
    'loops-executed-cell-id': '57b46720-b920-483f-a993-7366150e72ec',
    'loops-state': []
  },
  '3a36ec13-be8f-4196-8d21-00070f1bac46': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': ['out-of-order']
  },
  'c5fa3e0e-e1c5-4885-a1f9-2b84defe14a8': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '5feb7191-3fb4-4fe3-a8d5-743844750f67': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '04078702-fd06-43fc-9908-192b78766af3': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '8d0ab738-8f08-4721-bed7-bb7842bda81e': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '1079c70e-abb8-41b5-a51d-4148ae784cd1': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'df790206-7520-4756-8841-2424cdf5ea87': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'b6bfd35f-977c-463c-9033-0931442cefb2': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '5f9da874-64a7-4ebb-be04-66e0ffbc9964': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'da4346f2-6a59-416b-829a-a639e11215f4': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '79454b1c-b381-4f5f-ab97-d7260546bf50': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '61e467f9-b17c-47ee-87a3-05c805c7dfdb': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '55d0610e-5601-40e0-a9ea-581563599458': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': ['out-of-order']
  },
  'e0a20716-923f-4cb2-b797-bd7b13f596af': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'adebed11-c283-4787-b6a7-463a4b398595': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'ebdc49f9-f94d-490b-872b-a92d2e3ebea3': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '73b4b62d-55fb-42b4-a70b-b5898a0f41ad': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '076ffd99-6e66-45f3-9477-2f49b60563e2': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'a64d1387-c3bc-4f05-a4b7-56110ed838e2': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'ed685f3b-3243-48fb-bfa1-d21c76c4ecaf': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '7786d641-9904-41c2-b631-fd5a50879576': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'f6e80b7c-cff7-491c-ab8f-75b3fcaf2c5f': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'b62f0732-0f65-44fb-bdb1-16222d8f20d4': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '35dfa26f-9cf2-49ad-9778-887a4e7b91a2': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '74d4ccd5-d8b8-488d-a028-12fea0733ebe': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '940a094e-a098-4db4-aa42-0e8a71ddcb4d': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'c9345e15-8c12-45bf-9425-f31fec069c94': {
    'loops-executed-cell-id': 'cd3b0587-88bf-4bd6-9d2d-79170e239130',
    'loops-state': ['out-of-order']
  },
  'be0f1920-c27d-4feb-8181-b76109889548': {
    'loops-executed-cell-id': 'e0e2f030-6a42-46b1-b17a-43484f6bd178',
    'loops-state': ['out-of-order']
  },
  '21117fc2-72ee-4d01-922b-435a5d09af93': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': []
  },
  '5e0eea27-3bbd-4d01-9b67-892ee12a9308': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  '1380f54e-1b54-48fd-a9c1-2889e49959bf': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  '12fb0180-c7bc-43e0-a099-696bb71abe14': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': []
  },
  'e5d95eb7-372d-41ec-a70b-535a28f00eb0': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  '0dd76ecf-b904-4075-8976-4248f99ac4b2': {
    'loops-executed-cell-id': '8ef4181b-3b94-4445-ae1d-25e82f12e7ed',
    'loops-state': []
  },
  '6fc6b5c7-8203-44de-b73b-70af721a3f7a': {
    'loops-executed-cell-id': '8ed2f19c-6924-4a2c-93d7-b896d8e879a1',
    'loops-state': []
  },
  'a785c533-b6a4-46fe-b640-5ebd82e01d10': {
    'loops-executed-cell-id': 'cd3b0587-88bf-4bd6-9d2d-79170e239130',
    'loops-state': []
  },
  '4861da9f-c0d4-4618-bd9f-d7ddc621cbd4': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  'ea3d96af-5096-40eb-8382-7d1de161dd04': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '0cb89659-31c2-41e4-b285-0ad752d77135': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['out-of-order']
  },
  '17d9a7df-57e8-47d2-b2c4-fdefd88a9346': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  'be396f5f-c956-441a-9a45-65cff0399c8d': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  '93443a64-0134-438e-bbbd-5728de896466': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': []
  },
  'afc42e24-5661-4c33-9e60-27892534aa48': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  'd9b61090-a8e4-4b93-a4ad-f7359957eeba': {
    'loops-executed-cell-id': '8ef4181b-3b94-4445-ae1d-25e82f12e7ed',
    'loops-state': []
  },
  '8d1ce726-fbbf-442b-9c60-e0c03ca78157': {
    'loops-executed-cell-id': '8ed2f19c-6924-4a2c-93d7-b896d8e879a1',
    'loops-state': []
  },
  '9ccbd503-07c4-453e-9e44-a5cb81ecdbed': {
    'loops-executed-cell-id': 'cd3b0587-88bf-4bd6-9d2d-79170e239130',
    'loops-state': []
  },
  '395ad9e3-ad44-4b95-97bb-3a5bff7f093e': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '5ae8605d-1555-4fbd-b47f-21fdd7b52231': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['out-of-order']
  },
  '9f414736-7c01-4a8d-8496-fbbbb0f73334': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  '9be1f5b7-516c-4573-8b63-23ca9bbe91fa': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  '7caf622c-3ecc-4b62-9947-8a4356068a80': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['out-of-order']
  },
  '6621e454-2f46-4283-ba91-3ea0c54dab2f': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  '62735a52-b219-40f5-8682-9f991ac305a2': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  'd5b89b26-3747-4501-9db6-e97747a15152': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': []
  },
  'bf2152f1-f8c4-4a73-adbc-1000546b4cb8': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['out-of-order']
  },
  '6fa1f188-1d46-4f39-8da4-08cef7b140d5': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  'f030a55f-3bb3-42a9-8665-e542794e8ac6': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  'f2fa6283-8ba3-4b12-aab7-cecd5c147dcb': {
    'loops-executed-cell-id': '9d08dfaa-9dcf-46ee-917d-00cdb17f8ec6',
    'loops-state': []
  },
  '87cc6c1f-94bd-4c2d-b35f-35022570ba40': {
    'loops-executed-cell-id': '9d08dfaa-9dcf-46ee-917d-00cdb17f8ec6',
    'loops-state': []
  },
  'fff75d25-0ee3-405d-92f5-98a5121c50d7': {
    'loops-executed-cell-id': '9d08dfaa-9dcf-46ee-917d-00cdb17f8ec6',
    'loops-state': []
  },
  '40d95b00-6bf2-42bb-abee-8fd3659c179b': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': []
  },
  '5f4dc784-0a1a-4f3c-b799-9d78658f558e': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  'd0c34c4b-fd6c-4d84-8079-4a8a1de48025': {
    'loops-executed-cell-id': '8ef4181b-3b94-4445-ae1d-25e82f12e7ed',
    'loops-state': []
  },
  'a346b946-c8dc-4be1-9f07-a53b600a5317': {
    'loops-executed-cell-id': '8ed2f19c-6924-4a2c-93d7-b896d8e879a1',
    'loops-state': []
  },
  '96d8d8d2-2f31-4e9e-bece-8f80e50fe348': {
    'loops-executed-cell-id': 'cd3b0587-88bf-4bd6-9d2d-79170e239130',
    'loops-state': []
  },
  'c44aeb2b-d7fa-4c39-b786-ad6f82ddeb98': {
    'loops-executed-cell-id': '5c61ef40-533b-4cac-ac7c-976631763a14',
    'loops-state': []
  },
  '3d8dd728-5368-43a2-acc5-621f61ddf84f': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  '9381092a-5782-4a83-94df-fdc2f370f95e': {
    'loops-executed-cell-id': '9d9de1bd-bf01-4cb7-bb87-22de632ac5c9',
    'loops-state': []
  },
  '1295e91b-db6f-4074-99a2-0780c0809aba': {
    'loops-executed-cell-id': '9d9de1bd-bf01-4cb7-bb87-22de632ac5c9',
    'loops-state': []
  },
  '8ffc74c7-6dd1-46f9-859b-cb3fe5e7aea1': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': ['out-of-order']
  },
  '1ddf6b78-4420-42d0-aecb-4d1966c6d1d0': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  'e092123e-b5ef-4bb2-b45e-ef55d7eee6e1': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  '960fdae5-2506-461d-a0ba-a1fded6ad3c2': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  'df97a464-6033-46c1-b0f4-81ab0f9e745c': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  'ce4855be-9182-4d80-9748-cb1bb4d59d1f': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  'fabe24dd-2508-438a-9127-19f6f68c80cd': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  '2778dbee-c1d2-4558-bf3b-e3ac1d66b26a': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  'bc3cfaee-7982-44c9-87a9-3fb2d6fed515': {
    'loops-executed-cell-id': 'f37a3f41-4528-476f-b0ca-519854343af7',
    'loops-state': []
  },
  'c16578e3-7342-4843-adaf-1d98461fb8d9': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'd13cd3e0-9bac-4646-9f7c-b3e01af09769': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '91684c73-f6b6-4a86-8eb9-8fd10af7d4e2': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '07d2efa4-16b2-444d-bf63-22144aea27da': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'ae5fa530-4640-43fd-9542-9e77b1647e2a': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'f675c317-8f77-485e-8c13-8f4949446f14': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '27020830-65da-4f22-848d-50e8eaedc0c0': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'a822f2db-442d-4bf9-b491-56c4d120645b': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'b9b7907d-9aad-4940-ba18-cc0f74f49c0a': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '0cd1dce0-767b-4749-8178-1b364553500d': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '43abd09e-d8e0-433e-8d4e-1189bb99a7ed': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '9902a0e9-d7ab-4d6d-b73f-de82ecfe9755': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'c901481e-badc-4ad3-8d6b-6e842f529295': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '330dc228-6638-4dc7-8d46-d6e59c7242cf': {
    'loops-executed-cell-id': '9d9de1bd-bf01-4cb7-bb87-22de632ac5c9',
    'loops-state': []
  },
  'd34a64a4-3218-4167-95de-ffb26227c92c': {
    'loops-executed-cell-id': '9d9de1bd-bf01-4cb7-bb87-22de632ac5c9',
    'loops-state': []
  },
  '40b58fdf-c3c3-489d-8845-5309915a276c': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': ['out-of-order']
  },
  'd23497db-42f6-498c-a35a-8ae97d389275': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '89131e7b-83b3-479b-bfcf-d2af0b0656f4': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '6eab7341-8356-49d9-86eb-ebcaea5bafb6': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '64bc8191-0282-48a2-8679-45791ae29b13': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'd97141cf-cf5d-4909-8704-26824d4c895d': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '2e587534-417e-4d48-9e00-edd75ab6ff26': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'b6ba2129-02f3-4212-a4c9-d201811cfbd3': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'a5a7b8ed-3e02-408d-8d3c-4c7ce8095925': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': ['out-of-order']
  },
  'e1271725-76a1-4713-b600-f4b11e9176eb': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': ['out-of-order']
  },
  'd9647deb-7e1f-471f-ab6a-6e9b130af69f': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'fa5ed264-c8b3-4900-a075-06de6dc1e5a0': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '712438a9-dffa-4935-8aef-904e7467ee90': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '803bdb08-b554-4692-aa8d-a997811ba8b4': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'd58cf0eb-aa3d-4c8b-a058-74c1ff5bc870': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '328e2ea8-feac-4077-a71b-329f44eab3b5': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '88ab7d98-d2df-4ad2-aed4-9118f42621a3': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  '2e7a20cb-5e6b-4413-8396-b63b91ea9012': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  'cc29155e-7ef5-4c81-836c-fe8f811977e4': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '546f6e99-640e-4674-a844-024ee8659d72': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  'ef95dc8b-1bf2-4863-9824-bd9ee20caf81': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  'a865b80e-fded-4277-bf61-ab497076f54d': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': ['out-of-order']
  },
  '4899a59b-4174-4336-9f3a-8b127579d67a': {
    'loops-executed-cell-id': '4380b9f3-a5a2-4ad7-9970-40da28a206ce',
    'loops-state': []
  },
  'b06e0774-4562-463b-82d6-166e9d7a52cf': {
    'loops-executed-cell-id': '4380b9f3-a5a2-4ad7-9970-40da28a206ce',
    'loops-state': []
  },
  'e512e96b-593f-46d0-8766-5f78f51cd23d': {
    'loops-executed-cell-id': '4380b9f3-a5a2-4ad7-9970-40da28a206ce',
    'loops-state': []
  },
  '5818af2b-9586-4c45-ae7a-a6a4ae5a4c5f': {
    'loops-executed-cell-id': '4380b9f3-a5a2-4ad7-9970-40da28a206ce',
    'loops-state': []
  },
  'e1660483-3459-453d-8da0-b3975e9e49b4': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': ['out-of-order']
  },
  '057e8f0e-fa9a-43d8-a778-8fbec05395bf': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  '005bf50c-bf4a-4f2f-8f19-c34e7122ab34': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  '97603c26-bc28-4c47-a716-9d162448aabc': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  '870aaefb-5bde-437a-8a7f-df6703544d26': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '78111ba5-af1c-40fc-a36f-756c10db3087': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  'aff83da6-ee9c-4823-9155-6deea896d5ff': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '8a81a42c-04b2-418f-8684-d35a0f9b0eef': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  'c11f682e-0e45-46a2-ba66-601c977271dc': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '2988e862-6b33-4308-95a7-3f08a6f5ac2e': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '765a2e25-edf9-4893-8687-184ccb80a178': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '26d64158-d5ac-4bc3-b5bf-c4f6268f61ce': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '1d6e379c-48b4-4cfe-900b-5a766ee5964d': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '829ae8e6-f65b-4f9b-beef-4be4a130d51e': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': ['out-of-order']
  },
  'b9498ea8-7b28-4bb4-86b6-8a8bcca64bb7': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  'bf4741a1-846b-46fc-8b82-2b483837b104': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '0ea8074a-8df1-480c-8bc5-9453805351eb': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '106a4643-fd06-4042-bcd4-d60f46b4e4ab': {
    'loops-executed-cell-id': 'f715c685-3033-4408-8edb-3bc5b0c5fbdb',
    'loops-state': []
  },
  'b6419c4e-1a3b-49a3-a5cf-fc1bbb903467': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': ['out-of-order']
  },
  '134dd7c5-ef6a-46cb-81a6-9da21acac0e3': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '61c2d2a1-e76e-41d0-850c-af5c15f6c186': {
    'loops-executed-cell-id': 'f715c685-3033-4408-8edb-3bc5b0c5fbdb',
    'loops-state': []
  },
  'a05fd3e2-d04f-4364-b14c-4c2ec54eef7f': {
    'loops-executed-cell-id': 'e665b94a-db88-4a96-9eaa-18b8ef116f67',
    'loops-state': []
  },
  '42728a71-919a-49a5-96d0-38165963ede6': {
    'loops-executed-cell-id': 'f715c685-3033-4408-8edb-3bc5b0c5fbdb',
    'loops-state': ['out-of-order']
  },
  'e1efedab-c9c0-4a16-baca-994e6e4bf04e': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': ['out-of-order']
  },
  '00bf7b02-ff2e-4073-8b9f-fe5e8481d417': {
    'loops-executed-cell-id': 'e665b94a-db88-4a96-9eaa-18b8ef116f67',
    'loops-state': []
  },
  'c863e105-9efb-4fe7-b2c2-dc4c146ace2b': {
    'loops-executed-cell-id': 'e665b94a-db88-4a96-9eaa-18b8ef116f67',
    'loops-state': []
  },
  '741b86d3-3e39-4a56-b0c7-8a2e8cc2df4a': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': ['out-of-order']
  },
  '997cc58d-e7b6-4585-9bea-bcabbbf0c194': {
    'loops-executed-cell-id': 'e665b94a-db88-4a96-9eaa-18b8ef116f67',
    'loops-state': []
  },
  '2d22ecba-ac03-446f-a693-2fbea7371407': {
    'loops-executed-cell-id': 'e665b94a-db88-4a96-9eaa-18b8ef116f67',
    'loops-state': []
  },
  '6d7657b3-284a-4617-acc8-f03d2c52a89b': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': ['out-of-order']
  },
  '393a4728-129a-4f72-85b8-a0a105ab710a': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '6b4ad886-4ccb-4c5d-bb1d-0a9374d71db4': {
    'loops-executed-cell-id': 'f715c685-3033-4408-8edb-3bc5b0c5fbdb',
    'loops-state': []
  },
  '07e7dc4d-6cb8-488b-a801-da87d35a0018': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  'e5cae84c-e554-4e46-903e-7e45fdee737b': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  'b97e91cf-0771-49bf-9e66-5f33aface5c9': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  '8b6b4354-6a65-49d5-9f7f-d7c457261666': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  'cf1ab05a-6b2c-4de3-85b6-b7ff3debe8ff': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  '6817718a-07b4-4943-a123-353946d854e7': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  '0294835b-31e3-4209-ac5e-cdfbd723d5d4': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  '40138b77-9481-41e1-b1a1-2d38bba48ff8': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': ['out-of-order']
  },
  '92609582-df50-49f1-a5da-517338834a41': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  '12ac2c5f-0364-4c93-9c20-c8c73ce31307': {
    'loops-executed-cell-id': '2a06da23-7c6f-4efe-8700-95067cb26bde',
    'loops-state': []
  },
  'ff7788af-3ee7-4559-9401-3c83a78c29f8': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': ['out-of-order']
  },
  'df1fc0fe-c3c5-48e5-8ba8-79302d23c1db': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  '35c44f77-18c1-4622-b230-456e9df487f8': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '6fc67bed-150c-481e-98ba-48319ed13c35': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  'c94f597b-41bd-4859-bd12-482508df1d01': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  '14ff723c-dfa3-4e33-9b0c-33cdd3a7489d': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  '0d8cce92-e5dc-4dc3-89f7-a2449a0628a6': {
    'loops-executed-cell-id': '2a06da23-7c6f-4efe-8700-95067cb26bde',
    'loops-state': []
  },
  '6aa3582e-a234-4e37-b531-73323af06c20': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': ['out-of-order']
  },
  'f906b017-e38d-47e3-8278-4dc72536f0b1': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  'dbbc3c4a-4e6a-4a71-aa61-f4e1064f9707': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  'cd399d27-39e8-4b9a-b059-485430819b05': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '8faf8441-3648-4617-9e12-b277e692a059': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  'f87bb305-47a7-4511-ab81-5c43d0e2584d': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  '19fbff22-735d-4bf2-a271-9494d249ae26': {
    'loops-executed-cell-id': '2a06da23-7c6f-4efe-8700-95067cb26bde',
    'loops-state': []
  },
  '6733e7f1-8fd8-449e-9dd9-2dba32314ad4': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['out-of-order']
  },
  '4f134fd7-507b-42d6-bc7b-f1d256315128': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  '69b16a68-fa28-4b58-b056-1c858f7386ba': {
    'loops-executed-cell-id': '4f3b1232-9416-471a-8337-60ba02b753df',
    'loops-state': ['out-of-order']
  },
  'a3f0e9a4-9863-4dc7-bc8e-14c58ea974a5': {
    'loops-executed-cell-id': '05814875-d202-4266-8464-8cfbb1d113ee',
    'loops-state': []
  },
  '180ee25e-fa34-4bc6-9240-d4f70dd440cf': {
    'loops-executed-cell-id': 'b174b3b5-bc02-4f93-aa78-350ebc7fb02a',
    'loops-state': []
  },
  '2d40be88-da26-4f1d-8c4c-04a54b0666fd': {
    'loops-executed-cell-id': '2f4f0256-a69a-4f0d-aa48-3cc2ddf3dcdd',
    'loops-state': []
  },
  'de35de40-53ab-4a76-96b2-a9214a4fa8e8': {
    'loops-executed-cell-id': '3552e6ac-7c22-4c2b-bf1f-b3b019f47e72',
    'loops-state': []
  },
  '09645c0b-9f14-4746-96f3-b1bae0148a4f': {
    'loops-executed-cell-id': '8ef4181b-3b94-4445-ae1d-25e82f12e7ed',
    'loops-state': []
  },
  'b8920ce8-42b3-450d-aadd-261f03eca217': {
    'loops-executed-cell-id': '8ed2f19c-6924-4a2c-93d7-b896d8e879a1',
    'loops-state': []
  },
  '683c06be-ef1a-40cd-9043-198260e0008a': {
    'loops-executed-cell-id': 'cd3b0587-88bf-4bd6-9d2d-79170e239130',
    'loops-state': []
  },
  'dceb5a28-32f2-4c56-8d90-22d7756ca629': {
    'loops-executed-cell-id': '6512f102-b500-4740-8980-1e81155fabdf',
    'loops-state': []
  },
  'b39c51b2-e4e5-4a89-8f31-4d71de486156': {
    'loops-executed-cell-id': 'f3a2c192-3997-4e35-abf4-5e7b393af19e',
    'loops-state': []
  },
  'ef999532-64af-40ba-ad9c-99f0ce2d88e9': {
    'loops-executed-cell-id': 'd37a4152-2e9e-4023-8c0f-d9c2ba29e779',
    'loops-state': []
  },
  '36ce7880-3567-40dd-ab00-b467e9057965': {
    'loops-executed-cell-id': '48101310-cf3e-4065-b204-cc367cd9b705',
    'loops-state': []
  },
  '6eacdae3-9a48-45bf-8945-84f2bb884b0d': {
    'loops-executed-cell-id': 'd54f5f73-6455-4a7d-9fc4-ec70d4558f1e',
    'loops-state': []
  },
  '96315f10-1280-44a5-8d2a-3565968dc5f7': {
    'loops-executed-cell-id': '93b5131f-e607-411b-b458-1ac6a4966eee',
    'loops-state': []
  },
  'cfcf6764-226b-45c3-aadc-204af656f78f': {
    'loops-executed-cell-id': '2a06da23-7c6f-4efe-8700-95067cb26bde',
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
