import type { EntityKind, MetricConfig, SourceConfig } from './types';

/** 市区町村の値と出典に、都道府県の専用公表表を流用しない。 */
export function resolveMetricSource(config: MetricConfig, entity: EntityKind): SourceConfig {
  return entity === 'city' && config.citySource ? config.citySource : config.source;
}
