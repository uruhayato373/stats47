/** Spread a drawing limit across the full matching set instead of dropping its tail. */
export function sampleGeoSourceFeatures<T>(
  records: T[],
  matches: (record: T) => boolean,
  limit: number
) {
  if (!Number.isInteger(limit) || limit < 2)
    throw new Error('Drawing limit must be at least 2');
  let matched = 0;
  for (const record of records) if (matches(record)) matched++;
  const size = Math.min(matched, limit);
  const selected: T[] = [];
  let index = 0;
  for (const record of records) {
    if (!matches(record)) continue;
    const nextIndex =
      size <= 1
        ? 0
        : Math.round((selected.length * (matched - 1)) / (size - 1));
    if (selected.length < size && index === nextIndex) selected.push(record);
    index++;
  }
  return { matched, selected };
}
