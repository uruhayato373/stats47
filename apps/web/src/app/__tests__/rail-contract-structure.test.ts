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

/**
 * サイト全体のナビ (カテゴリ一覧) はルートの AppSidebar が持つ (2026-10-27 U4)。
 * home・/ranking・/category・都道府県ページはページ内にカテゴリ一覧の写しを置かない
 * (都道府県ページの右レール「カテゴリから探す」は 2026-10-28 に撤去)。
 */
const SITE_NAV_DEDUP_PAGES = [
  'src/app/page.tsx',
  'src/app/category/[categoryKey]/page.tsx',
  'src/app/areas/[areaCode]/page.tsx',
];

/**
 * 例外: /ranking はカテゴリの索引そのものが本文の役割 (ランキングの索引ハブ)。390px ではサイドバーが
 * Sheet に畳まれ、本文からカテゴリを探せなくなるため、件数付きの索引を本文に置く (2026-10-28)。
 * 左レールは作らない (本文の節として置く)。
 */
const CATEGORY_INDEX_HUB_PAGES = ['src/app/ranking/page.tsx'];

/**
 * 右レールを持たないページ。都道府県ページは目次を h1 下の 1 行ナビへ移し、右レールを撤去した
 * (2026-10-28 template-audit 2 巡目)。
 */
const NO_RIGHT_RAIL_PAGES = ['src/app/areas/[areaCode]/page.tsx'];

it('右レールを持たないページは RailStack / RightRailWidgets を使わない', () => {
  for (const page of NO_RIGHT_RAIL_PAGES) {
    const source = read(page);
    expect(source).not.toContain('RailStack');
    expect(source).not.toContain('RightRailWidgets');
  }
});

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
  it('カテゴリ導線ページはすべてサイドバーへ一本化した (ページ内に RailCategoryList を持つページが残っていない)', () => {
    expect(
      RAIL_CATEGORY_PAGES.filter(
        (page) =>
          !SITE_NAV_DEDUP_PAGES.includes(page) &&
          !CATEGORY_INDEX_HUB_PAGES.includes(page)
      )
    ).toEqual([]);
  });

  it.each(SITE_NAV_DEDUP_PAGES)(
    '%s はサイドバーと重複するカテゴリ一覧 (RailCategoryList / leftRail) を持たない',
    (relativePath) => {
      const source = read(relativePath);
      expect(source).not.toContain('RailCategoryList');
      expect(source).not.toMatch(/\bleftRail\b/);
    }
  );

  it.each(CATEGORY_INDEX_HUB_PAGES)(
    '%s はカテゴリの索引を本文の節に置き、左レールを作らない',
    (relativePath) => {
      const source = read(relativePath);
      expect(source).toContain('<RailCategoryList');
      expect(source).not.toMatch(/\bleftRail\b/);
    }
  );

  it.each(RAIL_CATEGORY_PAGES)(
    '%s は生の <aside> と PortalCategoryGrid を持たない',
    (relativePath) => {
      const source = read(relativePath);
      expect(source).not.toMatch(/<aside\b/);
      expect(source).not.toContain('PortalCategoryGrid');
    }
  );

  it.each(RAIL_CATEGORY_PAGES.filter((page) => !NO_RIGHT_RAIL_PAGES.includes(page)))(
    '%s は RailStack でレールを組む (共有 RightRailWidgets 経由を含む)',
    (relativePath) => {
      const source = read(relativePath);
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
