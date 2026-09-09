import type { GeoSourceField } from '@stats47/data-configs/business-plan';

export function visibleGeoSourceFields(
  fields: GeoSourceField[],
  properties: Record<string, unknown>
): GeoSourceField[] {
  return fields.filter(
    (field) => !field.onlyWhenPresent || field.key in properties
  );
}

export function formatGeoSourceProperty(
  field: GeoSourceField,
  properties: Record<string, unknown>
): string {
  const value = properties[field.key];
  if (value == null || value === '' || value === 'unknown') return 'データなし';
  const text = String(value);
  if (field.values?.[text]) return `${field.values[text]}（${text}）`;
  const unit =
    field.alternateUnit &&
    String(properties[field.alternateUnit.property]) ===
      field.alternateUnit.value
      ? field.alternateUnit.unit
      : field.unit;
  return unit && Number.isFinite(Number(value))
    ? `${Number(value).toLocaleString('ja-JP', { maximumFractionDigits: 6 })} ${unit}`
    : text;
}
