const LOCATION_ALIASES: [RegExp, string][] = [
  [
    /(?<![\p{L}\p{N}])(?:united states(?: of america)?|u\.?s\.?a\.?|u\.?s\.?)(?![\p{L}\p{N}])/giu,
    'United States',
  ],
  [
    /(?<![\p{L}\p{N}])(?:united kingdom|u\.?k\.?)(?![\p{L}\p{N}])/giu,
    'United Kingdom',
  ],
  [
    /(?<![\p{L}\p{N}])(?:united arab emirates|u\.?a\.?e\.?)(?![\p{L}\p{N}])/giu,
    'United Arab Emirates',
  ],
];

export const normalizeJobLocation = (location: string): string => {
  let normalized = location.trim().replace(/\s+/g, ' ');
  normalized = normalized
    .replace(/\bremote\s*\(([^()]+)\)/gi, '$1')
    .replace(/\bremote\s*[-–—:]\s*/gi, '')
    .replace(/^remote\b\s*(?:[-–—:,]\s*)?/i, '')
    .replace(/\s*[-–—,;(]?\s*\bremote\)?$/i, '')
    .replace(/^[/;|]\s*/, '')
    .trim();
  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    normalized = normalized.slice(1, -1).trim();
  }
  if (
    /^(?:not set|not specified|unspecified|unknown|n\/?a|none|null|-)?$/i.test(
      normalized,
    )
  ) {
    return '';
  }
  if (
    /^(?:worldwide|world wide|anywhere|global|everywhere)$/i.test(normalized)
  ) {
    return 'Worldwide';
  }
  for (const [pattern, replacement] of LOCATION_ALIASES) {
    normalized = normalized.replace(pattern, replacement);
  }
  return [...new Set(normalized.split(/\s*[;|]\s*/).filter(Boolean))].join(
    '; ',
  );
};
