import { describe, expect, it } from 'vitest';

import { findRailContractViolations } from '../rail-contract-audit.mjs';

const ids = (violations: Array<{ ruleId: string }>) =>
  violations.map((v) => v.ruleId);

/**
 * レール UI 契約の静的監査。各 rule について「違反 fixture は落ちる / 正しい fixture は通る」を固定する。
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
describe('findRailContractViolations', () => {
  it('page.tsx の生 <aside> を検出し、RailStack を使う page は通す', () => {
    expect(
      ids(
        findRailContractViolations(
          `const leftRail = (<aside className="lg:pr-1"><RailCard title="x">y</RailCard></aside>);`,
          'src/app/ranking/page.tsx'
        )
      )
    ).toEqual(['rail-no-raw-aside-in-page']);
    expect(
      findRailContractViolations(
        `const leftRail = (<RailStack><RailCard title="x">y</RailCard></RailStack>);`,
        'src/app/ranking/page.tsx'
      )
    ).toEqual([]);
    // 本文末注記の <aside> は理由付き allowlist
    expect(
      findRailContractViolations(
        `<aside className="mt-8">出典</aside>`,
        'src/app/municipalities/themes/[themeSlug]/page.tsx'
      )
    ).toEqual([]);
    // page 以外 (共有 Shell) の <aside> は対象外
    expect(
      findRailContractViolations(`<aside className="hidden">rail</aside>`, 'src/components/layout/LeftRailLayout.tsx')
    ).toEqual([]);
  });

  it('RailCard / SectionCard の外枠に bg-muted を置くと落ちる', () => {
    expect(
      ids(
        findRailContractViolations(
          `<RailCard\n  title="x"\n  className="bg-muted/30 p-4"\n>\n  y\n</RailCard>`,
          'src/features/x/components/X.tsx'
        )
      )
    ).toEqual(['rail-card-no-muted-root']);
    expect(
      findRailContractViolations(`<RailCard title="x" bodyClassName="px-4">y</RailCard>`, 'src/features/x/components/X.tsx')
    ).toEqual([]);
  });

  it('RailLinksCard の layout="grid" と、カテゴリ導線の独自実装を検出する', () => {
    expect(
      ids(
        findRailContractViolations(
          `<RailLinksCard title="テーマから探す" items={items} layout="grid" trackingSurface="blog_sidebar" />`,
          'src/features/blog/components/X.tsx'
        )
      )
    ).toEqual(['rail-links-no-grid-layout']);
    expect(
      ids(
        findRailContractViolations(
          `<RailLinksCard\n  title="カテゴリから探す"\n  items={items}\n  layout="list"\n  trackingSurface="blog_sidebar"\n/>`,
          'src/features/blog/components/X.tsx'
        )
      )
    ).toEqual(['rail-category-must-use-shared-list']);
    expect(
      ids(findRailContractViolations(`import { PortalCategoryGrid } from '@/features/home-portal';`, 'src/app/page.tsx'))
    ).toEqual(['rail-category-must-use-shared-list']);
    expect(
      findRailContractViolations(
        `<RailCard title="カテゴリから探す"><RailCategoryList items={items} trackingSurface="home_category" /></RailCard>`,
        'src/app/page.tsx'
      )
    ).toEqual([]);
  });

  it('ページ名に依存した variant を検出し、意味ベースの props は通す', () => {
    expect(
      ids(findRailContractViolations(`<RailCategoryList variant="blog" items={items} />`, 'src/features/blog/components/X.tsx'))
    ).toEqual(['rail-no-page-name-variant']);
    expect(
      findRailContractViolations(
        `<RailCategoryList density="compact" showCount={false} items={items} trackingSurface="blog_sidebar" />\n<PageShell variant="reading" />\n<BlogNavigationCards variant="rail" />`,
        'src/features/blog/components/X.tsx'
      )
    ).toEqual([]);
  });

  it('active 行のカラーバー (inset shadow) を検出する', () => {
    expect(
      ids(
        findRailContractViolations(
          `className={cn(active && "bg-accent shadow-[inset_3px_0_0_hsl(var(--primary))]")}`,
          'src/components/rail/X.tsx'
        )
      )
    ).toContain('rail-no-colored-inset-bar');
  });

  it('レール部品の <nav> には accessible name が要る (props 透過は許容)', () => {
    expect(
      ids(findRailContractViolations(`<nav className="flex">\n  x\n</nav>`, 'src/components/rail/X.tsx'))
    ).toEqual(['rail-nav-needs-accessible-name']);
    expect(
      findRailContractViolations(
        `<nav\n  aria-label="カテゴリから探す"\n  className="flex"\n>\n  x\n</nav>\n<nav className={cn("x", className)} {...props}>y</nav>`,
        'src/components/rail/X.tsx'
      )
    ).toEqual([]);
    // レール部品以外の <nav> は対象外
    expect(findRailContractViolations(`<nav className="flex">x</nav>`, 'src/features/x/components/X.tsx')).toEqual([]);
  });

  it('レール部品の <Link>/<button> は 44px のタップ領域 (min-h-11) を要求する', () => {
    expect(
      ids(
        findRailContractViolations(
          `<Link href="/x" className="inline-flex min-h-8 items-center text-xs">x</Link>`,
          'src/components/rail/X.tsx'
        )
      )
    ).toEqual(['rail-row-needs-44px-tap-target']);
    expect(
      findRailContractViolations(
        `<Link href="/x" className="inline-flex min-h-11 items-center text-xs sm:min-h-7">x</Link>\n<button type="button" className={railNavRowClassName({ active })}>y</button>\n<Link href="/y" className={RAIL_CHIP_CLASS}>z</Link>`,
        'src/components/rail/X.tsx'
      )
    ).toEqual([]);
  });
});
