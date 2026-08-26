import { describe, it, expect } from 'vitest';
import {
  PREFECTURES,
  PREFECTURE_CODES5,
  toCode5,
  toCode2,
  REGIONS,
} from '../src/data/prefectures';
import { PALETTES, paletteById } from '../src/design/palettes';
import { LAYOUTS } from '../src/design/layouts';
import { serializeSourcesCsv, type SourceRow } from '../src/data/sources';
import { normalizeDataset } from '../src/data/dataset';
import { validateDataset } from '../src/validators/dataset-validator';
import { SAMPLE_DATASET } from '../src/fixtures/sample-dataset';
import { rankingBarSpec, classifyChoropleth } from '../src/charts/chart-spec';
import { renderLicenseText } from '../src/licenses/license-text';
import {
  JAPAN_CLIP,
  loadPrefectureGeometry,
} from '../src/maps/prefecture-geometry';
import { LICENSE_IDS } from '../src/catalog/licenses';

describe('prefectures master', () => {
  it('has 47 prefectures with unique 5-digit codes', () => {
    expect(PREFECTURES.length).toBe(47);
    expect(new Set(PREFECTURE_CODES5).size).toBe(47);
    expect(REGIONS.flatMap((r) => r.prefCodes5).sort()).toEqual(
      [...PREFECTURE_CODES5].sort()
    );
  });
  it('normalizes any code notation to 5 digits', () => {
    expect(toCode5('1')).toBe('01000');
    expect(toCode5('01')).toBe('01000');
    expect(toCode5('13000')).toBe('13000');
    expect(toCode2('47000')).toBe('47');
    expect(() => toCode5('99')).toThrow();
  });
});

describe('design', () => {
  it('provides at least 3 CVD-safe palettes', () => {
    expect(PALETTES.filter((p) => p.cvdSafe).length).toBeGreaterThanOrEqual(3);
    expect(paletteById('okabe-ito').kind).toBe('categorical');
  });
  it('fixes layout dims incl. 620x620 coconala thumbnail', () => {
    expect(LAYOUTS['thumb-square'].wPx).toBe(620);
    expect(LAYOUTS['16x9'].wPx / LAYOUTS['16x9'].hPx).toBeCloseTo(16 / 9, 2);
  });
});

describe('sources csv', () => {
  it('prefixes UTF-8 BOM and uses CRLF (JP Excel safe)', () => {
    const rows: SourceRow[] = [
      {
        surveyName: '国勢調査',
        tableName: 'T1',
        statsDataId: '0003448237',
        url: 'https://e-stat.go.jp/',
        year: '2020',
        retrievedAt: '2026-07-18',
        unit: '人',
        transform: '集計',
        notes: 'カンマ,含む',
      },
    ];
    const csv = serializeSourcesCsv(rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('\r\n');
    expect(csv).toContain('"カンマ,含む"'); // カンマはクオート
  });
});

describe('dataset + validator', () => {
  it('fills all 47 prefectures, missing as null (not 0)', () => {
    const ds = normalizeDataset({
      indicator: 'x',
      unit: '件',
      year: '2023',
      source: {
        surveyName: 's',
        tableName: '-',
        statsDataId: '-',
        url: 'https://x',
        year: '2023',
        retrievedAt: '2026-07-18',
        unit: '件',
        transform: '-',
        notes: '-',
      },
      values: [{ code: '13000', value: 5 }], // 東京のみ与える
    });
    expect(ds.values.length).toBe(47);
    const tokyo = ds.values.find((d) => d.code5 === '13000');
    const other = ds.values.find((d) => d.code5 === '01000');
    expect(tokyo?.value).toBe(5);
    expect(other?.value).toBeNull();
    expect(other?.missing).toBe('missing'); // 0 埋めしない
  });
  it('validates the sample fixture as OK', () => {
    const r = validateDataset(SAMPLE_DATASET);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it('detects a corrupted dataset (negative control)', () => {
    const broken = {
      ...SAMPLE_DATASET,
      values: SAMPLE_DATASET.values.slice(1),
    };
    const r = validateDataset(broken);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === 'code-missing')).toBe(true);
  });
});

describe('chart specs', () => {
  it('ranks top/bottom excluding nulls', () => {
    const spec = rankingBarSpec(SAMPLE_DATASET, { topN: 5, bottomN: 5 });
    expect(spec.top.length).toBe(5);
    expect(spec.bottom.length).toBe(5);
    expect(spec.top[0].rank).toBe(1);
    expect(spec.top[0].value).toBeGreaterThanOrEqual(spec.top[1].value);
  });
  it('classifies choropleth into palette classes deterministically', () => {
    const c1 = classifyChoropleth(SAMPLE_DATASET, {
      classes: 5,
      paletteId: 'blues-sequential',
    });
    const c2 = classifyChoropleth(SAMPLE_DATASET, {
      classes: 5,
      paletteId: 'blues-sequential',
    });
    expect(c1.bins.length).toBe(47);
    expect(c1).toEqual(c2); // 決定的
    for (const b of c1.bins) expect(b.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('license text', () => {
  it('renders every registered license with resale prohibition', () => {
    for (const id of LICENSE_IDS) {
      const text = renderLicenseText(id);
      expect(text).toContain('再販売 / 再配布');
      expect(text).toContain('著作権の譲渡ではありません');
    }
    expect(() => renderLicenseText('nope')).toThrow();
  });
});

describe('prefecture geometry', () => {
  it('decodes 47 prefecture shapes with rings inside the projected box', () => {
    const geo = loadPrefectureGeometry(1000);
    expect(geo.shapes.length).toBe(47);
    expect(geo.width).toBe(1000);
    expect(geo.height).toBeGreaterThan(0);
    const codes = new Set(geo.shapes.map((s) => s.code5));
    expect(codes.size).toBe(47);
    for (const s of geo.shapes) {
      expect(s.rings.length).toBeGreaterThanOrEqual(1);
      for (const ring of s.rings) {
        expect(ring.length).toBeGreaterThanOrEqual(3);
        for (const p of ring) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1000 + 1e-6);
          expect(p.y).toBeGreaterThanOrEqual(-1e-6);
          expect(p.y).toBeLessThanOrEqual(geo.height + 1e-6);
        }
      }
    }
  }, 15_000);

  // ★2026-08-12: 上のテストは「点が枠内にあるか」しか見ておらず、投影が壊れていても通っていた。
  //   経度を「度」・緯度を Mercator の対数 (ラジアン系) で混ぜていたため x が 180/π 倍に伸び、
  //   商品の日本地図がアスペクト比 0.079 の平たい帯になっていた (正しくは約 1.12)。
  //   形が日本に見えるかは縦横比でしか機械判定できないので、ここで固定する。
  it('本土+沖縄の縦横比が実際の日本と一致する (投影の単位ずれを防ぐ)', () => {
    const geo = loadPrefectureGeometry(1000, JAPAN_CLIP);
    const aspect = geo.height / geo.width;
    // 経度 122-146 / 緯度 23-46 の Mercator 比は約 1.18。実データの端は少し内側なので幅を持たせる。
    expect(aspect).toBeGreaterThan(1.0);
    expect(aspect).toBeLessThan(1.35);
  });

  it('北海道が九州より北にあり、沖縄が最南にある (南北の向きが反転していない)', () => {
    const geo = loadPrefectureGeometry(1000, JAPAN_CLIP);
    const midY = (code5: string): number => {
      const s = geo.shapes.find((x) => x.code5 === code5);
      if (!s) throw new Error(`${code5} が無い`);
      const ys = s.rings.flat().map((p) => p.y);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    // y は画面座標 (下が大きい)
    expect(midY('01000')).toBeLessThan(midY('40000')); // 北海道 < 福岡
    expect(midY('47000')).toBeGreaterThan(midY('40000')); // 沖縄 > 福岡
  });

  it('東京が福岡より東にある (東西の向きが反転していない)', () => {
    const geo = loadPrefectureGeometry(1000, JAPAN_CLIP);
    const midX = (code5: string): number => {
      const s = geo.shapes.find((x) => x.code5 === code5);
      if (!s) throw new Error(`${code5} が無い`);
      const xs = s.rings.flat().map((p) => p.x);
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    };
    expect(midX('13000')).toBeGreaterThan(midX('40000'));
  });
});
