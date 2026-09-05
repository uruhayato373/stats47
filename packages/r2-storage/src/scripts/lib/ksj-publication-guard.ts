import { GIS_DATASETS } from '../../../../gis/src/mlit-ksj/datasets';
import { getKsjLicensePolicy } from '../../../../gis/src/mlit-ksj/license-policy';
import { METRICS_REGISTRY } from '../../../../data-configs/src/registry';

/** 生成済みの古いstagingも、汎用publisherから無審査で再公開させない。 */
export function assertKsjPublicKeysAllowed(keys: readonly string[]): void {
  for (const key of keys) {
    if (key.startsWith('gis/mlit-ksj/')) {
      const dataId = key.split('/')[2];
      const dataset = GIS_DATASETS.find(
        (item) => item.dataId === dataId || item.candidateAliases?.includes(dataId)
      );
      if (
        !dataset ||
        getKsjLicensePolicy(dataset.license).sourcePublication !== 'public-r2-eligible'
      ) {
        throw new Error(`KSJ public mirror禁止: ${key} (${dataset?.license ?? 'unassessed'})`);
      }
    }

    if (key.startsWith('app/stats/')) {
      const rankingKey = key.split('/')[2];
      const source = METRICS_REGISTRY[rankingKey]?.source;
      if (source?.kind === 'external' && source.fetcherKey === 'mlit_ksj') {
        const dataId = source.config?.ksjDataId;
        const input = GIS_DATASETS.find((item) => item.dataId === dataId);
        if (!input || !getKsjLicensePolicy(input.license).publicStructuredOutputAllowed) {
          throw new Error(`KSJ公開構造化データ禁止: ${key} (${String(dataId)}, ${input?.license ?? 'unassessed'})`);
        }
      }
      const dataset = GIS_DATASETS.find((item) =>
        item.rankingConfig?.some((ranking) => ranking.rankingKey === rankingKey)
      );
      if (dataset && !getKsjLicensePolicy(dataset.license).publicStructuredOutputAllowed) {
        throw new Error(`KSJ公開構造化データ禁止: ${key} (${dataset.dataId}, ${dataset.license})`);
      }
    }
  }
}
