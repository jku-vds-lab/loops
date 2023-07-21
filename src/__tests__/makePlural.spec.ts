import { makePlural } from '../util'; // Replace with the correct path to your makePlural file

describe('makePlural', () => {
  it('should add "s" to the end of the text when the amount is 0 or greater than 1', () => {
    expect(makePlural('apple', 0)).toBe('apples');
    expect(makePlural('banana', 2)).toBe('bananas');
    expect(makePlural('orange', 10)).toBe('oranges');
  });

  it('should not add "s" to the end of the text when the amount is exactly 1', () => {
    expect(makePlural('apple', 1)).toBe('apple');
    expect(makePlural('banana', 1)).toBe('banana');
    expect(makePlural('orange', 1)).toBe('orange');
  });
});
