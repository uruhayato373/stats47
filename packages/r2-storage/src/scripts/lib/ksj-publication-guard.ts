import { GIS_DATASETS } from '../../../../gis/src/mlit-ksj/datasets';
import { getKsjLicensePolicy } from '../../../../gis/src/mlit-ksj/license-policy';
import { METRICS_REGISTRY } from '../../../../data-configs/src/registry';
import { buildRecipe } from '../../../../data-configs/src/recipe';

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

    if (key.startsWith('app/stats/') || key.startsWith('app/ranking/') ||
      key.startsWith('app/japan/') || key.startsWith('app/correlation/by-ranking-key/')) {
      const rankingKey = key.startsWith('app/correlation/by-ranking-key/')
        ? key.slice('app/correlation/by-ranking-key/'.length).replace(/\.json$/, '')
        : key.split('/')[2];
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

/** 一次資料へ移行した同一keyに、古いKSJ stagingを再送しない。bodyは検査対象だけ読む。 */
export function assertKsjPublicAssetsAllowed(
  keys: readonly string[],
  readBody: (key: string) => Buffer,
): void {
  assertKsjPublicKeysAllowed(keys);
  for (const key of keys) {
    if (!key.startsWith('app/stats/')) continue;
    const metric = METRICS_REGISTRY[key.split('/')[2]];
    const source = metric?.source;
    if (source?.kind !== 'external' || source.fetcherKey !== 'manual') continue;
    const input = source.config;
    if (typeof input?.sourceSha256 !== 'string') continue;
    if (key !== `app/stats/${metric.key}/values.json`) {
      throw new Error(`一次資料移行後の未検証artifact: ${key}`);
    }
    const payload = JSON.parse(readBody(key).toString('utf8')) as {
      metricKey?: string;
      rows?: { areaCode: string; yearCode: string; value: number }[];
      meta?: { recipe?: { configHash?: string }; source?: {
        sourceSha256?: string; sha256?: string; dataDate?: string; nationalTotal?: number;
      } };
    };
    const evidence = payload.meta?.source;
    const rows = payload.rows;
    const expectedYear = String(input.dataDate).slice(0, 4);
    const expectedCodes = Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, '0')}000`);
    if (
      payload.metricKey !== metric.key ||
      payload.meta?.recipe?.configHash !== buildRecipe(metric).configHash ||
      evidence?.sourceSha256 !== input.sourceSha256 || evidence?.sha256 !== input.sourceSha256 ||
      evidence?.dataDate !== input.dataDate || evidence?.nationalTotal !== input.nationalTotal ||
      !Array.isArray(rows) || rows.length !== 47 ||
      expectedCodes.some((code) => rows.filter((row) => row.areaCode === code).length !== 1) ||
      rows.some((row) => row.yearCode !== expectedYear || !Number.isSafeInteger(row.value) || row.value < 0) ||
      rows.reduce((sum, row) => sum + row.value, 0) !== input.nationalTotal
    ) {
      throw new Error(`一次資料移行後の旧版・出典・47県保存則不一致: ${key}`);
    }
  }
}
