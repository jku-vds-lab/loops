import { expect, jest, test } from '@jest/globals';
import { formatTimeDuration, makePlural } from '../util';

const mockedMakePlural = jest.fn(makePlural);

describe('formatTimeDuration', () => {
  it('should format time correctly for durations less than 1 minute', () => {
    mockedMakePlural.mockReturnValue('seconds');
    expect(formatTimeDuration(0, 45 * 1000)).toBe('45 seconds');

    mockedMakePlural.mockReturnValue('second');
    expect(formatTimeDuration(0, 1 * 1000)).toBe('1 second');
  });

  it('should format time correctly for durations less than 100 minutes', () => {
    mockedMakePlural.mockReturnValue('minutes');
    expect(formatTimeDuration(0, 50 * 60 * 1000)).toBe('50 minutes');

    mockedMakePlural.mockReturnValue('minute');
    expect(formatTimeDuration(0, 79 * 60 * 1000)).toBe('79 minutes');
  });

  it('should format time correctly for durations less than 1 day', () => {
    mockedMakePlural.mockReturnValueOnce('hours');
    expect(formatTimeDuration(0, 4 * 3600 * 1000 + 30 * 60 * 1000)).toBe('4 hours'); // not '4 hours and 30 minutes'

    mockedMakePlural.mockReturnValueOnce('hour');
    mockedMakePlural.mockReturnValueOnce('minutes');
    expect(formatTimeDuration(0, 1 * 3600 * 1000 + 45 * 60 * 1000)).toBe('1 hour and 45 minutes');

    mockedMakePlural.mockReturnValue('hours');
    expect(formatTimeDuration(0, 12 * 3600 * 1000)).toBe('12 hours');
  });

  it('should format time correctly for durations greater than or equal to 1 day', () => {
    mockedMakePlural.mockReturnValueOnce('day');
    mockedMakePlural.mockReturnValueOnce('hours');
    expect(formatTimeDuration(0, 1 * 24 * 3600 * 1000 + 8 * 3600 * 1000)).toBe('1 day and 8 hours');

    mockedMakePlural.mockReturnValueOnce('days');
    expect(formatTimeDuration(0, 5 * 24 * 3600 * 1000 + 3 * 3600 * 1000)).toBe('5 days'); // not '5 days and 3 hours'

    mockedMakePlural.mockReturnValue('days');
    expect(formatTimeDuration(0, 7 * 24 * 3600 * 1000)).toBe('7 days');
  });
});
