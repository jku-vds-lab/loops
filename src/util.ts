/**
 * Merge arrays, preserving order of elements
 * @param newArray defines the order of elements
 * @param oldArray elements only in oldArray are added to the mergedArray based on their index
 * @returns
 */
export function mergeArrays(newArray: string[], oldArray: string[] | undefined): string[] {
  if (oldArray === undefined) {
    return newArray;
  }

  const mergedArray: string[] = [];

  // get the length of the longer array
  const length = newArray.length > oldArray.length ? newArray.length : oldArray.length;

  for (let i = 0; i < length; i++) {
    const newId = newArray[i];
    const oldId = oldArray[i];

    // first add id from newArray (precedence order)
    if (newId !== undefined) {
      // could be out of bounds already when oldArray is longer
      mergedArray.push(newId);
    }

    // if the ids are different or the newArray is already over
    // and oldID is not in newArray, add it to the mergedArray
    if (oldId !== undefined && oldId !== newId && !newArray.includes(oldId)) {
      mergedArray.push(oldId);
    }
  }

  return mergedArray;
}
