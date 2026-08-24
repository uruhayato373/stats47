import type { PageComponent } from './load-page-components';

export function parsePageComponents(value: unknown): PageComponent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parsePageComponent)
    .filter((component): component is PageComponent => component !== null);
}

function parsePageComponent(value: unknown): PageComponent | null {
  if (!isRecord(value)) return null;

  const componentKey = parseRequiredString(value.componentKey);
  const componentType = parseRequiredString(value.componentType);
  const title = parseRequiredString(value.title);
  const componentProps = parseRecord(value.componentProps);
  const gridColumnSpan = parseNumber(value.gridColumnSpan);
  const sortOrder = parseNumber(value.sortOrder);

  if (
    !componentKey ||
    !componentType ||
    !title ||
    !componentProps ||
    gridColumnSpan === null ||
    sortOrder === null
  ) {
    return null;
  }

  return {
    componentKey,
    componentType,
    title,
    description: parseNullableString(value.description),
    componentProps,
    sourceName: parseNullableString(value.sourceName),
    sourceLink: parseNullableString(value.sourceLink),
    rankingLink: parseNullableString(value.rankingLink),
    gridColumnSpan,
    gridColumnSpanTablet: parseNullableNumber(value.gridColumnSpanTablet),
    gridColumnSpanSm: parseNullableNumber(value.gridColumnSpanSm),
    dataSource: parseNullableString(value.dataSource),
    section: parseNullableString(value.section),
    sortOrder,
  };
}

function parseRequiredString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function parseNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseNullableNumber(value: unknown): number | null {
  return value == null ? null : parseNumber(value);
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
