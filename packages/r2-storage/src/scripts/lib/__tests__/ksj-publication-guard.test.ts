import { describe, expect, it } from 'vitest';

import { GIS_DATASETS } from '../../../../../gis/src/mlit-ksj/datasets';
import { getKsjLicensePolicy } from '../../../../../gis/src/mlit-ksj/license-policy';
import { METRICS_REGISTRY } from '../../../../../data-configs/src/registry';
import { assertKsjPublicKeysAllowed } from '../ksj-publication-guard';

describe('KSJ汎用publisherの公開境界', () => {
  it('登録された全データの現行licenseを正典から判定する', () => {
    for (const dataset of GIS_DATASETS) {
      for (const dataId of [dataset.dataId, ...(dataset.candidateAliases ?? [])]) {
        const publish = () => assertKsjPublicKeysAllowed([
          `gis/mlit-ksj/${dataId}/test/manifest.json`,
        ]);
        if (getKsjLicensePolicy(dataset.license).sourcePublication === 'public-r2-eligible') {
          expect(publish).not.toThrow();
        } else {
          expect(publish).toThrow('KSJ public mirror禁止');
        }
      }
    }
  });

  it('未登録KSJと非商用由来の公開観測値を拒否する', () => {
    expect(() => assertKsjPublicKeysAllowed(['gis/mlit-ksj/UNKNOWN/26/data.zip']))
      .toThrow('unassessed');
    const blocked = GIS_DATASETS.flatMap((dataset) =>
      getKsjLicensePolicy(dataset.license).publicStructuredOutputAllowed
        ? [] : dataset.rankingConfig ?? []
    );
    expect(blocked.length).toBeGreaterThan(0);
    for (const ranking of blocked) {
      expect(() => assertKsjPublicKeysAllowed([`app/stats/${ranking.rankingKey}/values.json`]))
        .toThrow('KSJ公開構造化データ禁止');
    }
    // GISのrankingConfigから漏れていた旧系列もmetricの実sourceで拒否する。
    expect(() => assertKsjPublicKeysAllowed(['app/stats/fishing-port-count/values.json']))
      .toThrow('KSJ公開構造化データ禁止');
  });

  it('datasetのrankingConfigだけでなく全metricの実入力を検査する', () => {
    for (const [key, metric] of Object.entries(METRICS_REGISTRY)) {
      const source = metric.source;
      if (source.kind !== 'external' || source.fetcherKey !== 'mlit_ksj') continue;
      const input = GIS_DATASETS.find((item) => item.dataId === source.config?.ksjDataId);
      if (!input || !getKsjLicensePolicy(input.license).publicStructuredOutputAllowed) {
        expect(() => assertKsjPublicKeysAllowed([`app/stats/${key}/values.json`]))
          .toThrow('KSJ公開構造化データ禁止');
      }
    }
  });

  it('現行Geo原典と別providerの観測値・記事は妨げない', () => {
    expect(() => assertKsjPublicKeysAllowed([
      'gis/mlit-ksj/mesh1000r6/24/source.zip',
      'gis/mlit-ksj/L01/26/source.zip',
      'gis/mlit-ksj/A31b/25/source.zip',
      'gis/mlit-ksj/S12/25/source.zip',
      'app/geo/population-station-access/manifest.json',
      'app/stats/total-population/values.json',
      'app/blog/example/article.md',
    ])).not.toThrow();
  });
});
