import { mergeArrays } from '../util';

describe('mergeArrays', () => {
  it('merges arrays while preserving order and removing duplicates', () => {
    const newerArray: string[] = ['id1', 'id2', 'id3', 'id4'];
    const olderArray: string[] = ['id1', 'id5', 'id3'];

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    expect(mergedArray).toEqual(['id1', 'id2', 'id5', 'id3', 'id4']);
  });
});

describe('mergeArrays', () => {
  it('merges arrays while preserving order and removing duplicates', () => {
    const newerArray: string[] = ['id1', 'id2', 'id3', 'id4', 'id6', 'id7']; // missing id5, add id3
    const olderArray: string[] = ['id1', 'id2', 'id4', 'id5', 'id6', 'id7']; // missing id3

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    console.log(mergedArray);
    expect(mergedArray).toEqual(['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7']);
  });
});

describe('mergeArrays', () => {
  it('merges arrays with oldArray being shorter than newArry', () => {
    const newerArray: string[] = ['id1', 'id2', 'id3', 'id4', 'id6', 'id7'];
    const olderArray: string[] = ['id7'];

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    console.log(mergedArray);
    expect(mergedArray).toEqual(['id1', 'id2', 'id3', 'id4', 'id6', 'id7']);
  });
});

describe('mergeArrays', () => {
  it('merges arrays with one being undefined', () => {
    const newerArray: string[] = ['id1', 'id2', 'id3', 'id4', 'id6', 'id7'];
    const olderArray = undefined;

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    console.log(mergedArray);
    expect(mergedArray).toEqual(['id1', 'id2', 'id3', 'id4', 'id6', 'id7']);
  });
});

describe('mergeArrays', () => {
  it('merges arrays with oldarray being empty', () => {
    const newerArray: string[] = ['id1', 'id2', 'id3', 'id4', 'id6', 'id7'];
    const olderArray = [];

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    console.log(mergedArray);
    expect(mergedArray).toEqual(['id1', 'id2', 'id3', 'id4', 'id6', 'id7']);
  });
});

describe('mergeArrays', () => {
  it('merges arrays with newArray being shorter than oldArray', () => {
    const newerArray: string[] = ['id1', 'id2'];
    const olderArray: string[] = ['id1', 'id5', 'id3'];

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    expect(mergedArray).toEqual(['id1', 'id2', 'id5', 'id3']);
  });
});

describe('mergeArrays', () => {
  it('merges arrays with newArray being empty', () => {
    const newerArray: string[] = [];
    const olderArray: string[] = ['id1', 'id5', 'id3'];

    const mergedArray: string[] = mergeArrays(newerArray, olderArray);

    expect(mergedArray).toEqual(['id1', 'id5', 'id3']);
  });
});
