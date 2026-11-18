import { expect, it } from 'vitest';
import { stableRecordId } from '../stable-record-id.util';

it('produces stable, distinct UUIDs for retryable records', () => {
  expect(stableRecordId('ashby:1')).toBe(stableRecordId('ashby:1'));
  expect(stableRecordId('ashby:1')).not.toBe(stableRecordId('lever:1'));
  expect(stableRecordId('ashby:1')).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});
