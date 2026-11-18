import { createHash } from 'node:crypto';

export const stableRecordId = (key: string): string => {
  const digest = createHash('sha256').update(key).digest();
  digest[6] = (digest[6] & 0x0f) | 0x40;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hexadecimal = digest.subarray(0, 16).toString('hex');
  return `${hexadecimal.slice(0, 8)}-${hexadecimal.slice(8, 12)}-${hexadecimal.slice(12, 16)}-${hexadecimal.slice(16, 20)}-${hexadecimal.slice(20)}`;
};
