import { createHash, webcrypto } from 'node:crypto';
import { TextEncoder as NodeTextEncoder } from 'node:util';

import { CULTURAL_HERITAGE_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  hashCulturalHeritageFacts,
  parseCulturalHeritageSnapshot,
  verifyCulturalHeritageSnapshot,
  type CulturalHeritageSnapshot,
} from '../lib/cultural-heritage-snapshot';
import { selectCulturalHeritageView } from '../lib/cultural-heritage-view';

import { culturalHeritageFixture } from './cultural-heritage-fixture';

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('TextEncoder', NodeTextEncoder);
});
afterEach(() => vi.unstubAllGlobals());
describe('scope and geography contract', () => {
  it('keeps 167 unique records, 177 type memberships, 162 county memberships and 14 unassigned records', () => {
    const data = parseCulturalHeritageSnapshot(culturalHeritageFixture());
    expect(data).not.toBeNull();
    expect(data!.records.reduce((sum, row) => sum + row.kinds.length, 0)).toBe(
      177
    );
    expect(
      data!.records.reduce((sum, row) => sum + row.prefectureCodes.length, 0)
    ).toBe(162);
    expect(selectCulturalHeritageView(data!, null)?.unspecifiedCount).toBe(14);
  });
  const cases: [string, (data: CulturalHeritageSnapshot) => void][] = [
    [
      'wrong scope',
      (d) => {
        (d as unknown as { scope: string }).scope = 'all-cultural-properties';
      },
    ],
    [
      'wrong observation date',
      (d) => {
        (d as unknown as { observedDate: string }).observedDate = '2025-01-01';
      },
    ],
    [
      'missing record',
      (d) => {
        d.records.pop();
      },
    ],
    [
      'duplicate original ID',
      (d) => {
        d.records[1] = d.records[0];
      },
    ],
    [
      'leading-zero ID normalization',
      (d) => {
        const r = d.records.find((r) => r.id === '00003445')!;
        r.id = '3445';
      },
    ],
    [
      'unexpected scope ID',
      (d) => {
        d.records[0].id = '999999';
      },
    ],
    [
      'lost second type',
      (d) => {
        d.records.find((r) => r.kinds.length > 1)!.kinds.pop();
      },
    ],
    [
      'allocated unassigned species',
      (d) => {
        d.records.find((r) => r.geography === 'unspecified')!.prefectureCodes =
          ['13000'];
      },
    ],
    [
      'lost multi-county membership',
      (d) => {
        d.records.find((r) => r.id === '3089')!.prefectureCodes.pop();
      },
    ],
    [
      'national park instead of designated Oze',
      (d) => {
        d.records.find((r) => r.id === '3089')!.prefectureCodes.push('09000');
      },
    ],
    [
      'pretended single-county geography',
      (d) => {
        d.records.find((r) => r.id === '3085')!.geography = 'prefecture';
      },
    ],
    [
      'invented missing location',
      (d) => {
        d.records.find((r) => r.location === null)!.location = '推測住所';
      },
    ],
    [
      'missing location swapped to another record',
      (d) => {
        d.records.find((r) => r.location === null)!.location = '記載あり';
        d.records[0].location = null;
      },
    ],
    [
      'unofficial detail link',
      (d) => {
        d.records[0].officialUrl = 'https://example.com/';
      },
    ],
    [
      'lost supplement evidence',
      (d) => {
        d.records.find((r) => r.id === '3073')!.evidence.pop();
      },
    ],
    [
      'wrong supplement URL',
      (d) => {
        d.records.find((r) => r.id === '3085')!.evidence[1].url =
          'https://example.com/';
      },
    ],
    [
      'wrong supplement SHA',
      (d) => {
        d.records.find((r) => r.id === '3089')!.evidence[1].sha256 = 'b'.repeat(
          64
        );
      },
    ],
    [
      'missing actual acquisition time',
      (d) => {
        d.records[0].evidence[0].retrievedAt = 'unknown';
      },
    ],
    [
      'supplement proof changed',
      (d) => {
        d.records.find((r) => r.id === '3080')!.evidence[1].basis =
          '県名を推測';
      },
    ],
    [
      'description copied into evidence',
      (d) => {
        d.records[0].evidence[0].basis = '第三者解説本文';
      },
    ],
    [
      'raw HTML leak',
      (d) => {
        Object.assign(d, { rawHtml: '<html>raw source</html>' });
      },
    ],
    [
      'image leak',
      (d) => {
        Object.assign(d.records[0], {
          imageUrl: 'https://example.com/image.jpg',
        });
      },
    ],
    [
      'owner information leak',
      (d) => {
        Object.assign(d.records[0], { owner: '所有者' });
      },
    ],
    [
      'markup injection',
      (d) => {
        d.records[0].name = '<img src=x>';
      },
    ],
  ];
  it.each(cases)('rejects %s', (_, mutate) => {
    const d = culturalHeritageFixture();
    mutate(d);
    expect(parseCulturalHeritageSnapshot(d)).toBeNull();
  });
  it('validates source facts, not merely a well-formed payload claiming a correct SHA', async () => {
    const d = culturalHeritageFixture();
    expect(parseCulturalHeritageSnapshot(d)).not.toBeNull();
    expect(await verifyCulturalHeritageSnapshot(d)).toBeNull();
    const facts = d.records.map(
      ({
        id,
        name,
        kinds,
        rawPrefecture,
        location,
        geography,
        prefectureCodes,
        officialUrl,
      }) => ({
        id,
        name,
        kinds,
        rawPrefecture,
        location,
        geography,
        prefectureCodes,
        officialUrl,
      })
    );
    expect(await hashCulturalHeritageFacts(d.records)).toBe(
      createHash('sha256').update(JSON.stringify(facts)).digest('hex')
    );
    const original = await hashCulturalHeritageFacts(d.records);
    d.records[0].location = '別所在地';
    expect(await hashCulturalHeritageFacts(d.records)).not.toBe(original);
  });
  it('preserves six multiple-county records and selects all 47 counties without allocating the 14 species', () => {
    const d = culturalHeritageFixture();
    let membership = 0;
    for (let i = 1; i <= 47; i++) {
      const code = String(i).padStart(2, '0') + '000';
      const v = selectCulturalHeritageView(d, code)!;
      expect(v).not.toBeNull();
      expect(v.records.every((r) => r.prefectureCodes.includes(code))).toBe(
        true
      );
      membership += v.total;
    }
    expect(membership).toBe(162);
    expect(selectCulturalHeritageView(d, '14000')?.total).toBe(0);
    expect(
      selectCulturalHeritageView(d, '20000')?.records.some(
        (r) => r.id === '3073'
      )
    ).toBe(true);
    expect(
      selectCulturalHeritageView(d, '07000')?.records.map((r) => r.id)
    ).toContain('3089');
    expect(
      selectCulturalHeritageView(d, '09000')?.records.map((r) => r.id)
    ).not.toContain('3089');
    expect(selectCulturalHeritageView(d, '13')).toBeNull();
    expect(selectCulturalHeritageView(d, '48000')).toBeNull();
  });
  it('keeps official source scope and tourism county selection across every kind', () => {
    const d = culturalHeritageFixture();
    for (const category of source.categories)
      expect(
        selectCulturalHeritageView(d, null, category.key)?.records.length
      ).toBe(category.recordIds.length);
    expect(selectCulturalHeritageView(d, '20000')?.tourismHref).toBe(
      '/themes/tourism?pref=20000'
    );
    expect(selectCulturalHeritageView(d, null)?.tourismHref).toBe(
      '/themes/tourism?pref=all'
    );
  });
});
