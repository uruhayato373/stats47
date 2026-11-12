import { describe, expect, it } from 'vitest';

import japanCatalogs from '../../../../../data/themes/japan/catalogs.json';
import kakeiCatalogs from '../../../../../data/themes/japan/kakei-catalogs.json';
import availability from '../../../../../data/municipalities/catalog/metric-availability.json';
import housing from '../../../../../data/municipalities/catalog/housing-survey-expansion.json';
import municipalityThemes from '../../../../../data/municipalities/catalog/themes.json';
import ssds from '../../../../../data/municipalities/catalog/ssds-expansion.json';
import { JAPAN_CATALOGS, listJapanCatalogThemes } from '../japan-catalog';
import { KAKEI_JAPAN_CATALOGS } from '../kakei-japan-catalog';
import {
  MUNICIPALITY_METRIC_AVAILABILITY,
  MUNICIPALITY_THEME_CATALOGS,
} from '../municipality-catalog';

// 全国・市区町村の台帳 (data/themes/japan・data/municipalities/catalog) と、読み込み口で結合した export の整合。
// 値の深い一致は移行時に控えと比べて確かめた。ここは件数・並び・結合の規則だけを固定する。
describe('全国のテーマの台帳と結合', () => {
  it('手書き 43 件の後ろに家計 7 件が続き、themeSlug はキーと一致する', () => {
    const recorded = Object.keys(japanCatalogs.themes);
    const kakei = Object.keys(kakeiCatalogs.themes);
    expect(recorded).toHaveLength(43);
    expect(kakei).toHaveLength(7);
    expect(Object.keys(JAPAN_CATALOGS)).toEqual([...recorded, ...kakei]);
    expect(listJapanCatalogThemes().every((theme) => JAPAN_CATALOGS[theme.themeSlug] === theme)).toBe(true);
  });

  it('家計のテーマは仕様の指標キーと同じ並びで、shortLabel は指標の題から結ぶ', () => {
    for (const [slug, spec] of Object.entries(kakeiCatalogs.themes)) {
      expect(KAKEI_JAPAN_CATALOGS[slug].metrics.map((metric) => metric.metricKey)).toEqual(spec.metricKeys);
    }
  });

  it('batches と notes は手書きのテーマだけを指し、batches は連続する範囲である', () => {
    const slugs = Object.keys(japanCatalogs.themes);
    for (const batch of japanCatalogs.batches) {
      const start = slugs.indexOf(batch.themeSlugs[0]);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(batch.themeSlugs).toEqual(slugs.slice(start, start + batch.themeSlugs.length));
    }
    for (const slug of Object.keys(japanCatalogs.notes)) expect(slugs).toContain(slug);
  });
});

describe('市区町村の台帳と結合', () => {
  it('公開判断は手書きの後ろに社会・人口統計体系、住宅・土地統計調査の順で並び、重ならない', () => {
    const recorded = Object.keys(availability.metrics);
    const ssdsKeys = Object.values(ssds.themeMetrics).flat();
    expect(recorded).toHaveLength(188);
    expect(new Set([...recorded, ...ssdsKeys, ...housing.keys]).size).toBe(recorded.length + ssdsKeys.length + housing.keys.length);
    expect(Object.keys(MUNICIPALITY_METRIC_AVAILABILITY)).toEqual([...recorded, ...ssdsKeys, ...housing.keys]);
  });

  it('batches は連続する範囲で、batches と notes は手書きの判断だけを指す', () => {
    const keys = Object.keys(availability.metrics);
    for (const batch of availability.batches) {
      const start = keys.indexOf(batch.metricKeys[0]);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(batch.metricKeys).toEqual(keys.slice(start, start + batch.metricKeys.length));
    }
    for (const key of Object.keys(availability.notes)) expect(keys).toContain(key);
  });

  it('テーマは手書き・住宅・新設の順で、拡充分と appendedMetrics が各テーマの指標の末尾へ足される', () => {
    const base = Object.keys(municipalityThemes.themes);
    expect(Object.keys(MUNICIPALITY_THEME_CATALOGS)).toEqual([
      ...base,
      housing.theme.slug,
      ...Object.keys(ssds.newThemes),
    ]);
    for (const [slug, theme] of Object.entries(MUNICIPALITY_THEME_CATALOGS)) expect(theme.slug).toBe(slug);
    for (const [slug, appended] of Object.entries(municipalityThemes.appendedMetrics)) {
      const keys = MUNICIPALITY_THEME_CATALOGS[slug].metricKeys;
      expect(keys.slice(keys.length - appended.length)).toEqual(appended);
    }
  });
});
