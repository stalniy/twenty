import { expect, it } from 'vitest';
import { parseInertiaPage } from '../parse-inertia-page.util';

it('decodes attribute entities before reading embedded JSON', () => {
  expect(
    parseInertiaPage(
      '<div data-page="{&quot;name&quot;:&quot;R&amp;D &#x27;Tools&#x27;&quot;}"></div>',
    ),
  ).toEqual({ name: "R&D 'Tools'" });
});
it.each([
  '<html>Sign in</html>',
  '<div data-page=""></div>',
  '<div data-page="not-json"></div>',
])('rejects missing or malformed page data', (html) => {
  expect(() => parseInertiaPage(html)).toThrow();
});
