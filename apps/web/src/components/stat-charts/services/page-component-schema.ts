import type { PageComponent } from './load-page-components';

export function parsePageComponents(value: unknown): PageComponent[] {
  if (!Array.isArray(value)) throw new Error('page-components payload must be an array');
  return value.map((component, index) => parsePageComponent(component, index));
}

function parsePageComponent(value: unknown, index: number): PageComponent {
  if (!isRecord(value)) throw new Error(`page-components[${index}] must be an object`);

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
    throw new Error(`page-components[${index}] is schema-invalid`);
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
  if (value == null) return null;
  if (typeof value !== 'string') throw new Error('nullable string field is schema-invalid');
  return value;
}

function parseNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const parsed = parseNumber(value);
  if (parsed === null) throw new Error('nullable number field is schema-invalid');
  return parsed;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
