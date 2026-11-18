const CONTENT_PREFIX = /^\s*\{\s*"content"\s*:\s*"/;
const JSON_STRING_CHUNK =
  /^(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[\da-fA-F]{4}))*/;

export const createCompletionTextStream = (onText: (text: string) => void) => {
  let pending = '';
  let trailingSurrogate = '';
  let readingContent = false;
  let finished = false;

  return (delta: string) => {
    if (finished) return;
    pending += delta;
    if (!readingContent) {
      const prefix = CONTENT_PREFIX.exec(pending);
      if (!prefix) {
        // Any other leading property falls back to the final, validated completion.
        finished = !'{"content":"'.startsWith(pending.replace(/\s/g, ''));
        return;
      }
      readingContent = true;
      pending = pending.slice(prefix[0].length);
    }

    const encoded = JSON_STRING_CHUNK.exec(pending)?.[0] ?? '';
    pending = pending.slice(encoded.length);
    finished = pending.startsWith('"');
    let text = trailingSurrogate + JSON.parse('"' + encoded + '"');
    trailingSurrogate = '';
    if (!finished && /[\uD800-\uDBFF]$/.test(text)) {
      trailingSurrogate = text.slice(-1);
      text = text.slice(0, -1);
    }
    if (text) onText(text);
  };
};
