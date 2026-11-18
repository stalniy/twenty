import { expect, it } from 'vitest';
import { normalizeJobLocation } from '../normalize-job-location.util';

it.each([
  ['USA', 'United States'],
  ['us', 'United States'],
  ['U.S.A.', 'United States'],
  ['United States of America', 'United States'],
  ['United States', 'United States'],
  ['Remote (USA)', 'United States'],
  ['Remote - United States', 'United States'],
  ['USA (Remote)', 'United States'],
  ['San Francisco / Remote (United States)', 'San Francisco / United States'],
  [
    'San Francisco, CA or Remote (United States)',
    'San Francisco, CA or United States',
  ],
  [
    'San Francisco, New York or Remote (United States)',
    'San Francisco, New York or United States',
  ],
  ['Vancouver, Toronto or Remote (Canada)', 'Vancouver, Toronto or Canada'],
  ['GameChanger Remote - United States', 'GameChanger United States'],
  ['/ Remote (United States)', 'United States'],
  ['San Francisco / Remote (USA)', 'San Francisco / United States'],
  ['UK', 'United Kingdom'],
  ['U.A.E.', 'United Arab Emirates'],
  ['Remote (Europe)', 'Europe'],
  ['  New York,   USA ', 'New York, United States'],
  ['Poland; Spain', 'Poland; Spain'],
  ['USA | United States; UK', 'United States; United Kingdom'],
  ['Remote - Anywhere', 'Worldwide'],
  ['global', 'Worldwide'],
  [
    'US / Canada (Eastern time zone)',
    'United States / Canada (Eastern time zone)',
  ],
  ['Austin, TX', 'Austin, TX'],
  ['CA', 'CA'],
  ['Australia', 'Australia'],
])('normalizes %s to %s', (location, expected) => {
  expect(normalizeJobLocation(location)).toBe(expected);
  expect(normalizeJobLocation(expected)).toBe(expected);
});

it.each([
  '',
  ' ',
  'not set',
  'Not specified',
  'unknown',
  'N/A',
  'null',
  '-',
  'Remote',
])('leaves unavailable geography empty: %s', (location) =>
  expect(normalizeJobLocation(location)).toBe(''),
);
