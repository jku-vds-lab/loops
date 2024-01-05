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

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 *
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the amount of time
 */
export function formatTimeDuration(timestamp1, timestamp2) {
  const diffInSeconds = Math.abs(Math.floor((timestamp2 - timestamp1) / 1000));

  if (diffInSeconds < 60) {
    // < 1min
    return diffInSeconds + ' ' + makePlural('second', diffInSeconds);
  } else if (diffInSeconds < 100 * 60) {
    // < 100min
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    return diffInMinutes + ' ' + makePlural('minute', diffInMinutes);
  } else if (diffInSeconds < 24 * 3600) {
    // < 1 day
    const diffInHours = Math.floor(diffInSeconds / 3600);
    const remainingDiffInMinutes = Math.floor((diffInSeconds % 3600) / 60);

    //if diffInHours is 1, also return the minutes
    if (diffInHours === 1) {
      return (
        diffInHours +
        ' ' +
        makePlural('hour', diffInHours) +
        ' and ' +
        remainingDiffInMinutes +
        ' ' +
        makePlural('minute', remainingDiffInMinutes)
      );
    }

    return diffInHours + ' ' + makePlural('hour', diffInHours);
  } else {
    // >= 1 day
    const diffInDays = Math.floor(diffInSeconds / (24 * 3600));
    const remainingDiffInHours = Math.floor((diffInSeconds % (24 * 3600)) / 3600);

    //if diffInDays is 1, also return the hours
    if (diffInDays === 1) {
      return (
        diffInDays +
        ' ' +
        makePlural('day', diffInDays) +
        ' and ' +
        remainingDiffInHours +
        ' ' +
        makePlural('hour', remainingDiffInHours)
      );
    }

    return diffInDays + ' ' + makePlural('day', diffInDays);
  }
}

export function makePlural(text: string, amount: number): string {
  return amount === 1 ? text : `${text}s`;
}

const isScrollable = (node: Element) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return false;
  }
  const style = getComputedStyle(node);
  return ['overflow', 'overflow-x', 'overflow-y'].some(propertyName => {
    const value = style.getPropertyValue(propertyName);
    return value === 'auto' || value === 'scroll';
  });
};

export const getScrollParent = (node: Element): Element => {
  let currentParent = node.parentElement;
  while (currentParent) {
    if (isScrollable(currentParent)) {
      return currentParent;
    }
    currentParent = currentParent.parentElement;
  }
  return document.scrollingElement || document.documentElement;
};
