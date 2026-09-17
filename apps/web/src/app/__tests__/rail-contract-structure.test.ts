import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * レール UI 契約 (RailStack / RailCard collapsible / RailCategoryList / RailNavRow /
 * RailLinksCard 新契約) への全ページ移行を source レベルで固定する。
 * 決定的監査は `scripts/lib/rail-contract-audit.mjs` (check-design-system.mjs) が別途行う。
 * 本テストは「カテゴリ導線を共有 RailCategoryList に統一したか」「廃止した
 * PortalCategoryGrid / layout="grid" / layout="compact-chips" が再混入していないか」を守る。
 */

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.resolve(ROOT, relativePath), 'utf8');
}

const RAIL_CATEGORY_PAGES = [
  'src/app/page.tsx',
  'src/app/ranking/page.tsx',
  'src/app/category/[categoryKey]/page.tsx',
  'src/app/areas/[areaCode]/page.tsx',
];

const RAIL_DATA_DISCOVERY_CARDS = 'src/components/rail/RailDataDiscoveryCards.tsx';

/**
 * fast-glob は apps/web の直接依存ではない (モノレポの他パッケージ経由でのみ解決できる場合がある)
 * ため、依存関係を増やさず readdirSync の再帰列挙で glob 相当を実現する。
 */
function listFilesRecursive(dir: string, exts: string[]): string[] {
  const absoluteDir = path.resolve(ROOT, dir);
  let entries: string[];
  try {
    entries = readdirSync(absoluteDir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const abs = path.join(absoluteDir, entry);
    const stats = statSync(abs);
    if (stats.isDirectory()) {
      if (['node_modules', '.next', '__tests__'].includes(entry)) continue;
      out.push(...listFilesRecursive(path.relative(ROOT, abs), exts));
      continue;
    }
    if (exts.some((ext) => entry.endsWith(ext))) {
      out.push(path.relative(ROOT, abs).split(path.sep).join('/'));
    }
  }
  return out;
}

function listTsxFiles(dir: string): string[] {
  return listFilesRecursive(dir, ['.ts', '.tsx']).filter(
    (file) => !file.includes('__tests__') && !/\.test\.tsx?$/.test(file)
  );
}

describe('rail contract: カテゴリ導線ページの共有部品移行', () => {
  it.each(RAIL_CATEGORY_PAGES)('%s は RailCategoryList を使う', (relativePath) => {
    const source = read(relativePath);
    expect(source).toContain('RailCategoryList');
  });

  it.each(RAIL_CATEGORY_PAGES)(
    '%s は生の <aside> と PortalCategoryGrid を持たない',
    (relativePath) => {
      const source = read(relativePath);
      expect(source).not.toMatch(/<aside\b/);
      expect(source).not.toContain('PortalCategoryGrid');
    }
  );

  it.each(RAIL_CATEGORY_PAGES)(
    '%s は RailStack でレールを組む (共有 RightRailWidgets 経由を含む)',
    (relativePath) => {
      const source = read(relativePath);
      // areas/[areaCode] は RightRailWidgets (共有部品) を使い、RailStack はその内部が持つ。
      const usesRailStackDirectly = source.includes('RailStack');
      const usesSharedRailStackWrapper = source.includes('RightRailWidgets');
      expect(usesRailStackDirectly || usesSharedRailStackWrapper).toBe(true);
    }
  );

  it('RailDataDiscoveryCards.tsx は RailCategoryList を使う', () => {
    const source = read(RAIL_DATA_DISCOVERY_CARDS);
    expect(source).toContain('RailCategoryList');
  });
});

describe('rail contract: 廃止した layout 値の再混入防止', () => {
  it('src/components/rail と src/features/**/components に layout="grid" が無い', () => {
    const files = [
      ...listTsxFiles('src/components/rail'),
      ...listTsxFiles('src/features'),
    ].filter((file) => file.includes('/components/'));

    const offenders = files.filter((file) =>
      /layout=["']grid["']/.test(read(file))
    );
    expect(offenders).toEqual([]);
  });

  it('src/components/rail と src/features/**/components に layout="compact-chips" が無い', () => {
    const files = [
      ...listTsxFiles('src/components/rail'),
      ...listTsxFiles('src/features'),
    ].filter((file) => file.includes('/components/'));

    const offenders = files.filter((file) =>
      /compact-chips/.test(read(file))
    );
    expect(offenders).toEqual([]);
  });
});
