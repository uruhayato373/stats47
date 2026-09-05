import { describe, expect, it } from 'vitest';

import { GIS_DATASETS } from '../../../../../gis/src/mlit-ksj/datasets';
import { getKsjLicensePolicy } from '../../../../../gis/src/mlit-ksj/license-policy';
import { METRICS_REGISTRY } from '../../../../../data-configs/src/registry';
import { buildRecipe } from '../../../../../data-configs/src/recipe';
import { assertKsjPublicAssetsAllowed, assertKsjPublicKeysAllowed } from '../ksj-publication-guard';

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
    for (const key of ['app/ranking/fishing-port-count/item.json',
      'app/ranking/dam-count/ogp/ogp.png', 'app/japan/dam-count/series.json',
      'app/correlation/by-ranking-key/dam-count.json']) {
      expect(() => assertKsjPublicKeysAllowed([key])).toThrow('KSJ公開構造化データ禁止');
    }
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

describe('商用一次資料への置換後も旧stagingを拒否する', () => {
  for (const key of ['roadside-station-count', 'fishing-port-count-ksj', 'port-count']) {
    const metric = METRICS_REGISTRY[key];
    const input = metric.source.kind === 'external' ? metric.source.config! : {};
    const makePayload = () => ({
      metricKey: key,
      rows: Array.from({ length: 47 }, (_, i) => ({
        areaCode: `${String(i + 1).padStart(2, '0')}000`,
        yearCode: String(input.dataDate).slice(0, 4), value: i === 0 ? Number(input.nationalTotal) : 0,
      })),
      meta: { recipe: buildRecipe(metric), source: {
        sourceSha256: input.sourceSha256, sha256: input.sourceSha256,
        dataDate: input.dataDate, nationalTotal: input.nationalTotal,
      } },
    });
    const check = (payload: unknown) => assertKsjPublicAssetsAllowed(
      [`app/stats/${key}/values.json`], () => Buffer.from(JSON.stringify(payload)),
    );
    it(`${key}: 現行版47県・全国保存則を許可する`, () => {
      expect(() => check(makePayload())).not.toThrow();
    });
    it(`${key}: 旧版・出典欠落・重複・保存則違反を拒否する`, () => {
      const oldYear = makePayload(); oldYear.rows[0].yearCode = '2018';
      const oldRecipe = makePayload(); oldRecipe.meta.recipe.configHash = 'stale';
      const wrongSource = makePayload(); wrongSource.meta.source.sha256 = 'stale';
      const duplicate = makePayload(); duplicate.rows[1].areaCode = '01000';
      const badTotal = makePayload(); badTotal.rows[0].value--;
      for (const payload of [{}, oldYear, oldRecipe, wrongSource, duplicate, badTotal]) {
        expect(() => check(payload)).toThrow('一次資料移行後の旧版');
      }
    });
  }
  it('無関係な大容量assetは読み込まない', () => {
    assertKsjPublicAssetsAllowed(['app/geo/example/item.json'], () => {
      throw new Error('不要なbody read');
    });
  });
});
