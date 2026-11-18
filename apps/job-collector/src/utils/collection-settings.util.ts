const parseFilterValues = (value: string | undefined, defaults: string[]) => {
  const values = (value ?? '')
    .split(/[,;\n]+/)
    .map((entry) => entry.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  return values.length ? [...new Set(values)] : defaults;
};

export const collectionSettings = () => {
  const keywords = parseFilterValues(process.env.JOB_KEYWORD, ['TypeScript']);
  const legacySlugField =
    process.env.ASHBY_COMPANY_SLUG_FIELD?.trim() || 'ashbyhqSlug';
  if (!/^[_A-Za-z][_0-9A-Za-z]*$/.test(legacySlugField)) {
    throw new Error('ASHBY_COMPANY_SLUG_FIELD must be a GraphQL field name');
  }
  return { keywords, legacySlugField };
};
