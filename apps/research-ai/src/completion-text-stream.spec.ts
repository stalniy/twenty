import { expect, it, vi } from 'vitest';

import { createCompletionTextStream } from './completion-text-stream.ts';

it('emits decoded content as it arrives and keeps tool arguments out of the text stream', () => {
  const onText = vi.fn();
  const read = createCompletionTextStream(onText);
  read('{"cont');
  read('ent":"Hello\\n\\uD83D');
  expect(onText.mock.calls).toEqual([['Hello\n']]);
  read('\\uDE00 \\"Twenty\\"');
  expect(onText.mock.calls).toEqual([['Hello\n'], ['😀 "Twenty"']]);
  read('","toolCalls":[{"name":"lookup","arguments":"{}"}]}');
  expect(onText).toHaveBeenCalledTimes(2);
});
