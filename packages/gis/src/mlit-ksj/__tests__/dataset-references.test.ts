import { describe, expect, it } from 'vitest';

import { GEO_LAYERS } from '../../../../data-configs/src/business-plan/geo-layers';
import { GEO_SOURCE_PAGES } from '../../../../data-configs/src/business-plan/geo-source-pages';
import { METRICS_REGISTRY } from '../../../../data-configs/src/registry';
import { INFRA_PUBLICATION_REQUIRED_SCOPES } from '../../infra-history/types';
import { INFRA_NETWORKS, infraNetworkPageUrl, infraNetworkTerms, isInfraNetworkAdFree } from '../../infra-history/networks';
import { GIS_DATASETS, resolveKsjUsageTerms, type KsjDataId } from '../datasets';
import { getKsjLicensePolicy } from '../license-policy';
import { PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS, UNREGISTERED_KSJ_OFFICIAL_POLICY } from '../official-policy';
import { KSJ_CODE_CONFIG } from '../registry';

/**
 * GIS 台帳 (datasets.ts) を親表とした参照整合 (RDB の外部キー相当)。R2 もネットワークも読まない。
 *
 * `npm run geo:check-data-catalog` は R2 の在庫まで見るので手動・CI 外で走る。台帳どうしの ID のずれは
 * R2 と無関係に起きるので、ここで pre-commit と CI に載せて止める。gis パッケージ内の参照は
 * `KsjDataId` 型でも縛るが、data-configs は gis に依存できない (依存が循環する) ので、ここだけが守りになる。
 */

const REGISTERED = new Set<string>(GIS_DATASETS.map((dataset) => dataset.dataId));
const ALIASES = new Set<string>(GIS_DATASETS.flatMap((dataset) => dataset.candidateAliases ?? []));
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function unknownIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].filter((id) => !REGISTERED.has(id) && !ALIASES.has(id)).sort();
}

describe('GIS 台帳 (親表)', () => {
  it('dataId は重複せず、候補カタログの別 ID とも衝突しない', () => {
    expect(REGISTERED.size).toBe(GIS_DATASETS.length);
    expect([...ALIASES].filter((alias) => REGISTERED.has(alias))).toEqual([]);
  });

  it('登録データはすべて版と技術設定 (registry.ts) を持つ', () => {
    expect(GIS_DATASETS.filter((d) => !d.latestVersion).map((d) => d.dataId)).toEqual([]);
    expect(GIS_DATASETS.filter((d) => !KSJ_CODE_CONFIG.has(d.dataId)).map((d) => d.dataId)).toEqual([]);
  });

  it('登録データはすべて公式の個別データページの URL を持つ', () => {
    expect(GIS_DATASETS.filter((d) => !d.sourcePageUrl).map((d) => d.dataId).sort()).toEqual([]);
  });

  it('使い方ごとの利用条件は根拠の文言と確認日を持つ', () => {
    for (const dataset of GIS_DATASETS) {
      for (const [usage, terms] of Object.entries(dataset.usageTerms ?? {})) {
        expect(terms?.evidence, `${dataset.dataId} ${usage}`).not.toBe('');
        expect(terms?.verifiedAt, `${dataset.dataId} ${usage}`).toMatch(DATE_PATTERN);
      }
    }
  });

  it('公式利用条件の一覧と台帳で、公開と商用利用の扱いが食い違わない', () => {
    // 区分名 (cc-by-4.0 / commercial-ok) の違いは扱いが同じなら許す。m250r6・m500r6 は個別ページが
    // CC BY 4.0 (2026-10-29 確認) なので台帳も一覧も cc-by-4.0 に揃えた
    const mismatched = GIS_DATASETS.filter((dataset) => {
      const official = UNREGISTERED_KSJ_OFFICIAL_POLICY.get(dataset.dataId);
      if (!official) return false;
      const a = getKsjLicensePolicy(dataset.license);
      const b = getKsjLicensePolicy(official.license);
      return (
        a.sourcePublication !== b.sourcePublication ||
        a.commercialUse !== b.commercialUse ||
        a.publicStructuredOutputAllowed !== b.publicStructuredOutputAllowed
      );
    }).map((dataset) => dataset.dataId);
    expect(mismatched).toEqual([]);
  });
});

describe('GIS 台帳を参照する表 (子表)', () => {
  it('技術設定 (registry.ts) は登録データだけを持ち、キーと dataId が一致する', () => {
    expect(unknownIds([...KSJ_CODE_CONFIG.keys()])).toEqual([]);
    for (const [key, config] of KSJ_CODE_CONFIG) expect(config.dataId).toBe(key);
  });

  it('公開取得の件数表は登録済みで公開取得の判定を受けたデータだけを持つ', () => {
    expect(unknownIds([...PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.keys()])).toEqual([]);
    for (const dataId of PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.keys()) {
      expect(UNREGISTERED_KSJ_OFFICIAL_POLICY.get(dataId)?.decision, dataId).toBe('acquire');
    }
  });

  it('GIS 一覧と単体 GIS ページは登録データだけを参照する', () => {
    expect(unknownIds(GEO_LAYERS.map((layer) => layer.dataId))).toEqual([]);
    expect(unknownIds(GEO_SOURCE_PAGES.map((page) => page.dataId))).toEqual([]);
  });

  it('国土数値情報を原典にする指標は、登録データか公式利用条件の判定済みデータだけを参照する', () => {
    const ksjIds = Object.values(METRICS_REGISTRY).flatMap((metric) => {
      const source = metric.source;
      if (source?.kind !== 'external' || source.fetcherKey !== 'mlit_ksj') return [];
      return [String(source.config?.ksjDataId ?? '')];
    });
    expect(ksjIds.filter((id) => !REGISTERED.has(id) && !UNREGISTERED_KSJ_OFFICIAL_POLICY.has(id))).toEqual([]);
  });

  it('交通網の変遷は台帳の公式ページと使い方の利用条件を引け、非商用なら広告を出さず未承認のまま公開しない', () => {
    for (const network of INFRA_NETWORKS) {
      expect(() => infraNetworkPageUrl(network)).not.toThrow();
      const terms = infraNetworkTerms(network);
      if (terms.license === 'non-commercial') {
        expect(isInfraNetworkAdFree(network), network.key).toBe(true);
        if (network.publication.status === 'public-approved') {
          expect(network.publication.permissionEvidence).not.toBeNull();
        for (const scope of INFRA_PUBLICATION_REQUIRED_SCOPES) expect(network.publication.permissionEvidence?.scope, network.key).toContain(scope);
        expect(network.publication.permissionEvidence?.date, network.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(network.publication.permissionEvidence?.counterpart, network.key).toBeTruthy();
        }
      }
      // 現況ページへのリンク先は、単体 GIS ページを持つ登録データ
      if (network.currentDataId) {
        expect(unknownIds([network.currentDataId]), network.key).toEqual([]);
        expect(GEO_SOURCE_PAGES.some((page) => page.dataId === network.currentDataId), network.key).toBe(true);
      }
    }
  });
});

describe('resolveKsjUsageTerms', () => {
  it('使い方ごとの条件を返し、書かれていない使い方は根拠が無いので null を返す', () => {
    expect(resolveKsjUsageTerms('N06', 'time-series')?.license).toBe('non-commercial');
    expect(resolveKsjUsageTerms('N06', 'current')?.license).toBe('cc-by-4.0');
    expect(resolveKsjUsageTerms('N02', 'time-series')).toBeNull();
  });

  it('台帳に無い dataId は型検査で落ちる', () => {
    // @ts-expect-error 台帳に無い dataId は KsjDataId に入らない
    const unknown: KsjDataId = 'X99';
    expect(REGISTERED.has(unknown)).toBe(false);
  });
});
