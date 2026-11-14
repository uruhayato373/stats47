import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { listAllMetrics } from '../registry';

/**
 * 社会・人口統計体系 (0000010208) の項目名が名乗る分母と対象を、指標の題名・副題が落とさない契約。
 *
 * e-Stat の項目名は `#H06302_郵便局数（可住地面積100km2当たり）` のように「何を何で割った値か」を持つ。
 * post-office-count-per-100km2 は副題が「面積100km²当たり」で、原表の「可住地面積」を落としていた
 * (可住地面積と総面積では分母が違い、東京都の値が変わる)。cleaning-shop-count-per-100k は
 * 原表が「クリーニング業数」なのに題名が「クリーニング所数」だった (SNS-SOURCE-METADATA-01)。
 */
const META = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../data/estat/meta/0000010208.json');

type MetaClass = { id: string; objects?: { code: string; name: string }[] };

function itemNames(): Map<string, string> {
  const meta = JSON.parse(readFileSync(META, 'utf8')) as { dimensions?: unknown; classes?: MetaClass[] };
  const names = new Map<string, string>();
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === 'object') {
      const o = node as Record<string, unknown>;
      if (typeof o.code === 'string' && typeof o.name === 'string' && o.code.startsWith('#')) {
        names.set(o.code, o.name.replace(/^#[A-Z0-9]+_/, ''));
      }
      Object.values(o).forEach(walk);
    }
  };
  walk(meta);
  return names;
}

const normalize = (s: string) => s.replace(/[㎡²]/g, '2').replace(/km2|ｋ㎡|km²/g, 'km2').replace(/\s/g, '');

describe('SSDS 項目名の分母・対象を題名と副題が保つ', () => {
  const names = itemNames();
  const ssds = listAllMetrics().filter(
    (m) => m.source.kind === 'estat' && m.source.statsDataId === '0000010208' && m.source.cdCat01,
  );

  it('項目名を読めている (空振りしていない)', () => {
    expect(names.get('#H06302')).toContain('可住地面積');
  });

  it('項目名に「可住地面積」の分母がある指標は、副題か題名に「可住地面積」を持つ', () => {
    const violations = ssds
      .filter((m) => normalize(names.get(m.source.kind === 'estat' ? (m.source.cdCat01 as string) : '') ?? '').includes('可住地面積'))
      .filter((m) => !`${m.title}${m.subtitle ?? ''}`.includes('可住地面積'))
      .map((m) => `${m.key}: ${m.title} / ${m.subtitle ?? ''}`);
    expect(violations).toEqual([]);
  });

  it('項目名の対象語 (…業数・…所数) を題名が別の語へ言い換えない', () => {
    const m = ssds.find((x) => x.key === 'cleaning-shop-count-per-100k');
    expect(m).toBeDefined();
    const base = (names.get('#H06119') ?? '').replace(/（.*$/, '');
    expect(base).toBe('クリーニング業数');
    expect(m!.title).toContain(base);
  });
});
