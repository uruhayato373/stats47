/** Google Dataset requires a 50–5,000 character description on every Dataset node. */
export function invalidDatasetDescriptions(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((node, index) => invalidDatasetDescriptions(node, `${path}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];
  const node = value as Record<string, unknown>;
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  const length = typeof node.description === 'string' ? Array.from(node.description.trim()).length : 0;
  const errors = types.includes('Dataset') && (length < 50 || length > 5000)
    ? [`${path}.description: ${length} characters (expected 50–5000)`]
    : [];
  return errors.concat(Object.entries(node).flatMap(([key, child]) =>
    invalidDatasetDescriptions(child, `${path}.${key}`)));
}
